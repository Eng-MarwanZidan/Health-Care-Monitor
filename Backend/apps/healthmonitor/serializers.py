from rest_framework import serializers
from .models import Patient, Measurement, Prediction

class PredictionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prediction
        fields = ('id','risk_score','risk_label','created_at','measurement')
        read_only_fields = ('id','risk_score','risk_label','created_at','measurement')

class MeasurementSerializer(serializers.ModelSerializer):
    # include nested prediction if exists
    prediction = PredictionSerializer(read_only=True)
    
    # Add validation to vital signs
    heart_rate = serializers.FloatField(min_value=30, max_value=200)
    spo2 = serializers.FloatField(min_value=50, max_value=100)
    systolic = serializers.FloatField(min_value=40, max_value=300)
    diastolic = serializers.FloatField(min_value=30, max_value=200)
    respiratory_rate = serializers.FloatField(min_value=5, max_value=60, required=False, allow_null=True)
    temperature = serializers.FloatField(min_value=35, max_value=42, required=False, allow_null=True)

    class Meta:
        model = Measurement
        # Expose patient as id on create, but in our Create view we pass patient explicitly.
        fields = ('id','patient','timestamp','heart_rate','spo2','systolic','diastolic',
                'respiratory_rate','temperature','notes','created_at','prediction')
        read_only_fields = ('patient','timestamp','created_at')

class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = '__all__'
        read_only_fields = ('user', 'created_at')
