from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from accounts.permissions import IsPlatformAdmin
from .models import Clinic, Department
from .serializers import ClinicListSerializer, ClinicSerializer, ClinicCreateSerializer, DepartmentSerializer


@api_view(['GET'])
@permission_classes([AllowAny])
def clinic_list(request):
    qs = Clinic.objects.filter(is_active=True).prefetch_related('departments')
    return Response(ClinicListSerializer(qs, many=True).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def clinic_detail(request, pk):
    try:
        clinic = Clinic.objects.prefetch_related('departments').get(pk=pk, is_active=True)
    except Clinic.DoesNotExist:
        return Response({'detail': 'Clinic not found.'}, status=status.HTTP_404_NOT_FOUND)
    return Response(ClinicSerializer(clinic).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def clinic_departments(request, pk):
    try:
        clinic = Clinic.objects.get(pk=pk, is_active=True)
    except Clinic.DoesNotExist:
        return Response({'detail': 'Clinic not found.'}, status=status.HTTP_404_NOT_FOUND)
    depts = clinic.departments.filter(is_active=True)
    return Response(DepartmentSerializer(depts, many=True).data)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsPlatformAdmin])
def admin_clinics(request):
    if request.method == 'GET':
        qs = Clinic.objects.all().prefetch_related('departments')
        return Response(ClinicListSerializer(qs, many=True).data)
    ser = ClinicCreateSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    clinic = ser.save()
    return Response(ClinicSerializer(clinic).data, status=status.HTTP_201_CREATED)
