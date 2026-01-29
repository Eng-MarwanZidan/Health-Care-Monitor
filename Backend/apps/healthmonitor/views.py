from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import Patient, Measurement, Prediction
from .serializers import PatientSerializer, MeasurementSerializer, PredictionSerializer
from django.shortcuts import get_object_or_404
from django.http import Http404
import logging

logger = logging.getLogger(__name__)

class PatientListCreateView(generics.ListCreateAPIView):
    serializer_class = PatientSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Patient.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        logger.info("Patient is created successfully.")

class PatientDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PatientSerializer
    permission_classes = (permissions.IsAuthenticated,)
    lookup_field = 'id'

    def get_queryset(self):
        return Patient.objects.filter(user=self.request.user)

class MeasurementListCreateView(generics.ListCreateAPIView):
    serializer_class = MeasurementSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        patient_id = self.kwargs.get('patient_id')
        return Measurement.objects.filter(patient__id=patient_id, patient__user=self.request.user)

    def perform_create(self, serializer):
        patient = get_object_or_404(Patient, id=self.kwargs.get('patient_id'), user=self.request.user)
        measurement = serializer.save(patient=patient)

        try:
            from core.ai_model import get_health_ai
            ai = get_health_ai()
            result = ai.predict({
                'heart_rate': measurement.heart_rate,
                'spo2': measurement.spo2,
                'systolic': measurement.systolic,
                'diastolic': measurement.diastolic,
                'respiratory_rate': measurement.respiratory_rate,
                'temperature': measurement.temperature,
            })

            if "error" in result:
                logger.error(f"AI Error for measurement {measurement.id}: {result.get('detail')}")
                score = 0.0
                label = "invalid"
                reason = "Invalid input"
            else:
                score = float(result['risk_score'])
                label = result['risk_label']
                reason = result['reason']
                logger.info("Measurement is saved and prediction is generated successfully.")

            Prediction.objects.create(
                measurement=measurement,
                risk_score=score,
                risk_label=label,
                reason=reason 
            )

        except Exception as e:
            logger.exception(f"AI failure for measurement {measurement.id}: {e}")

    def create(self, request, *args, **kwargs):
        try:
            response = super().create(request, *args, **kwargs)
            # re-serialize the created object including prediction
            try:
                # find created instance id from response
                created_id = response.data.get('id')
                if created_id:
                    instance = Measurement.objects.select_related('prediction').get(id=created_id, patient__user=request.user)
                    data = MeasurementSerializer(instance, context={'request': request}).data
                    return Response(data, status=status.HTTP_201_CREATED)
            except Exception:
                pass
            return response
        except Exception as e:
            logger.error(f"Measurement creation error: {str(e)}", exc_info=True)
            raise

class MeasurementDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = MeasurementSerializer
    permission_classes = (permissions.IsAuthenticated,)
    lookup_field = 'id'

    def get_queryset(self):
        return Measurement.objects.filter(patient__user=self.request.user)

class PredictionForMeasurementView(generics.RetrieveAPIView):
    serializer_class = PredictionSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        measurement = get_object_or_404(
            Measurement,
            id=self.kwargs.get('measurement_id'),
            patient__user=self.request.user
        )

        try:
            return Prediction.objects.get(measurement=measurement)
        except Prediction.DoesNotExist:
            raise Http404("Prediction does not exist for this measurement.")

