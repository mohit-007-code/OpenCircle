# backend/communities/admin.py
from django.contrib import admin
from .models import Community, CommunityMembership

@admin.register(Community)
class CommunityAdmin(admin.ModelAdmin):
    list_display = ['name', 'creator', 'member_count', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name', 'description', 'creator__username']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['created_at', 'updated_at', 'member_count']

@admin.register(CommunityMembership)
class CommunityMembershipAdmin(admin.ModelAdmin):
    list_display = ['user', 'community', 'role', 'joined_at']
    list_filter = ['role', 'joined_at']
    search_fields = ['user__username', 'community__name']
