from django.db import models
from django.conf import settings

class Patient(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='patients')
    full_name = models.CharField(max_length=200)
    dob = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.full_name}'

class Measurement(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='measurements')
    timestamp = models.DateTimeField(auto_now_add=True)
    heart_rate = models.FloatField()
    spo2 = models.FloatField()        # oxygen saturation %
    systolic = models.FloatField()
    diastolic = models.FloatField()
    respiratory_rate = models.FloatField(null=True, blank=True)
    temperature = models.FloatField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Measurement {self.id} for {self.patient}'
class Prediction(models.Model):
    measurement = models.OneToOneField(Measurement, on_delete=models.CASCADE, related_name='prediction')
    risk_score = models.FloatField()
    risk_label = models.CharField(max_length=50)
    reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
            return f'Prediction {self.id} on {self.measurement} : ({self.risk_label} {self.risk_score})'