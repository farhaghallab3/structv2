from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from .models import Workspace, System, Template, Table, Record, Notification
from .serializers import (
    UserSerializer, WorkspaceSerializer, SystemSerializer,
    TemplateSerializer, TableSerializer, RecordSerializer,
    NotificationSerializer
)
from .services import install_template_for_workspace, install_default_systems


def _resolve_username(identifier):
    """Accept username or email for login."""
    if not identifier:
        return None
    if '@' in identifier:
        user = User.objects.filter(email__iexact=identifier).first()
        return user.username if user else identifier
    return identifier


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def signup(request):
    """User signup"""
    data = request.data
    email = (data.get('email') or '').strip()
    password = data.get('password')
    name = (data.get('name') or data.get('username') or '').strip()
    username = (data.get('username') or email).strip()

    if not all([username, email, password]):
        return Response(
            {'error': 'Name, email, and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if User.objects.filter(username=username).exists():
        return Response(
            {'error': 'An account with this email already exists'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if User.objects.filter(email__iexact=email).exists():
        return Response(
            {'error': 'Email is already registered'},
            status=status.HTTP_400_BAD_REQUEST
        )

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=name,
    )

    workspace = Workspace.objects.create(
        name=f"{name or username}'s Workspace",
        owner=user,
    )

    install_default_systems(workspace)

    token, _ = Token.objects.get_or_create(user=user)

    return Response({
        'user': UserSerializer(user).data,
        'token': token.key,
        'workspace': WorkspaceSerializer(workspace).data,
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login(request):
    """User login"""
    data = request.data
    identifier = (data.get('email') or data.get('username') or '').strip()
    password = data.get('password')

    if not all([identifier, password]):
        return Response(
            {'error': 'Email and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    username = _resolve_username(identifier)
    user = authenticate(username=username, password=password)

    if not user:
        return Response(
            {'error': 'Invalid email or password'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    token, _ = Token.objects.get_or_create(user=user)
    workspace = user.workspaces.first()

    return Response({
        'user': UserSerializer(user).data,
        'token': token.key,
        'workspace': WorkspaceSerializer(workspace).data if workspace else None,
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def install_template(request, workspace_id):
    """Install a template as a new system in the workspace."""
    try:
        workspace = Workspace.objects.get(id=workspace_id, owner=request.user)
    except Workspace.DoesNotExist:
        return Response({'error': 'Workspace not found'}, status=status.HTTP_404_NOT_FOUND)

    template_name = request.data.get('template_name') or request.data.get('name')
    if not template_name:
        return Response({'error': 'template_name is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        system = install_template_for_workspace(workspace, template_name)
    except ValueError as exc:
        return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    return Response(SystemSerializer(system).data, status=status.HTTP_201_CREATED)


class WorkspaceViewSet(viewsets.ModelViewSet):
    """Workspace management"""
    serializer_class = WorkspaceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Workspace.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class SystemViewSet(viewsets.ModelViewSet):
    """System management"""
    serializer_class = SystemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        workspace_id = self.kwargs.get('workspace_id')
        return System.objects.filter(workspace__owner=self.request.user, workspace_id=workspace_id)

    def perform_create(self, serializer):
        workspace = Workspace.objects.get(owner=self.request.user, id=self.kwargs['workspace_id'])
        serializer.save(workspace=workspace)


class TableViewSet(viewsets.ModelViewSet):
    """Table management"""
    serializer_class = TableSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        system_id = self.kwargs.get('system_id')
        return Table.objects.filter(system__workspace__owner=self.request.user, system_id=system_id)

    def perform_create(self, serializer):
        system = System.objects.get(id=self.kwargs['system_id'], workspace__owner=self.request.user)
        serializer.save(system=system)


class RecordViewSet(viewsets.ModelViewSet):
    """Record management"""
    serializer_class = RecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        table_id = self.kwargs.get('table_id')
        return Record.objects.filter(table__system__workspace__owner=self.request.user, table_id=table_id)

    def perform_create(self, serializer):
        table = Table.objects.get(id=self.kwargs['table_id'], system__workspace__owner=self.request.user)
        serializer.save(table=table)


class TemplateViewSet(viewsets.ReadOnlyModelViewSet):
    """Template gallery"""
    serializer_class = TemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Template.objects.all()


class NotificationViewSet(viewsets.ModelViewSet):
    """Notification management"""
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def mark_as_read(self, request):
        """Mark notification as read"""
        notification_id = request.data.get('id')
        try:
            notification = Notification.objects.get(id=notification_id, user=request.user)
            notification.is_read = True
            notification.save()
            return Response({'success': True})
        except Notification.DoesNotExist:
            return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_dashboard_data(request):
    """Get all dashboard data for the user"""
    workspace = request.user.workspaces.first()
    if not workspace:
        return Response({'error': 'No workspace found'}, status=status.HTTP_404_NOT_FOUND)

    systems = workspace.systems.prefetch_related('tables__records').all()
    templates = Template.objects.all()

    return Response({
        'workspace': WorkspaceSerializer(workspace).data,
        'systems': SystemSerializer(systems, many=True).data,
        'templates': TemplateSerializer(templates, many=True).data,
    }, status=status.HTTP_200_OK)
