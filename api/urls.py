from django.urls import path
from . import views
urlpatterns = [
    path('auth/signup/', views.signup, name='signup'),
    path('auth/login/', views.login, name='login'),
    path('dashboard/', views.get_dashboard_data, name='dashboard'),
    path('workspaces/', views.WorkspaceViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('workspaces/<int:pk>/', views.WorkspaceViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'})),
    path('workspaces/<int:workspace_id>/install-template/', views.install_template, name='install-template'),
    path('workspaces/<int:workspace_id>/systems/', views.SystemViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('workspaces/<int:workspace_id>/systems/<int:pk>/', views.SystemViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'})),
    path('systems/<int:system_id>/tables/', views.TableViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('systems/<int:system_id>/tables/<int:pk>/', views.TableViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'})),
    path('tables/<int:table_id>/columns/', views.update_columns, name='update-columns'),
    path('tables/<int:table_id>/records/', views.RecordViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('tables/<int:table_id>/records/<int:pk>/', views.RecordViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'})),
    path('templates/', views.TemplateViewSet.as_view({'get': 'list'})),
    path('templates/<int:pk>/', views.TemplateViewSet.as_view({'get': 'retrieve'})),
    path('notifications/unread_count/', views.NotificationViewSet.as_view({'get': 'unread_count'})),
    path('notifications/mark_as_read/', views.NotificationViewSet.as_view({'post': 'mark_as_read'})),
    path('notifications/mark_all_read/', views.NotificationViewSet.as_view({'post': 'mark_all_read'})),
    path('notifications/', views.NotificationViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('notifications/<int:pk>/', views.NotificationViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'})),
    # ── Agent ──────────────────────────────────────────────
    path('systems/<int:system_id>/agent/', views.agent_run, name='agent-run'),
]
