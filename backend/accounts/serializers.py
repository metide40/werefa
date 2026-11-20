from django.contrib.auth import authenticate
from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    staff_clinic_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'staff_clinic', 'staff_clinic_name',
        ]
        read_only_fields = fields

    def get_staff_clinic_name(self, obj):
        if obj.staff_clinic_id and obj.staff_clinic:
            return obj.staff_clinic.name
        return None


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=6)
    full_name = serializers.CharField(max_length=150)
    email = serializers.EmailField(required=False, allow_blank=True)
    phone_number = serializers.CharField(max_length=40, required=False, allow_blank=True)
    preferred_language = serializers.ChoiceField(
        choices=['en', 'am', 'om'], default='en', required=False
    )

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('Username already taken.')
        return value

    def create(self, validated_data):
        from patients.models import Patient
        full_name = validated_data.pop('full_name')
        phone = validated_data.pop('phone_number', '')
        lang = validated_data.pop('preferred_language', 'en')
        parts = full_name.strip().split(None, 1)
        first = parts[0] if parts else ''
        last = parts[1] if len(parts) > 1 else ''
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            email=validated_data.get('email', ''),
            first_name=first,
            last_name=last,
            role=User.Role.PATIENT,
        )
        Patient.objects.create(
            user=user,
            full_name=full_name,
            phone_number=phone,
            preferred_language=lang,
        )
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        username = (data.get('username') or '').strip()
        password = data.get('password') or ''
        user = authenticate(username=username, password=password)
        # Allow email as login identifier
        if not user and '@' in username:
            try:
                match = User.objects.get(email__iexact=username)
                user = authenticate(username=match.username, password=password)
            except User.DoesNotExist:
                user = None
            except User.MultipleObjectsReturned:
                user = None
        if not user:
            raise serializers.ValidationError('Invalid username or password.')
        if not user.is_active:
            raise serializers.ValidationError('Account is disabled.')
        data['user'] = user
        return data
