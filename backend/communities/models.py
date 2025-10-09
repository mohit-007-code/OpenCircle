# backend/communities/models.py
from django.db import models
from django.conf import settings
from django.utils.text import slugify
from django.utils import timezone

class Community(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    description = models.TextField(max_length=500)
    
    # Images
    display_picture = models.ImageField(
        upload_to='communities/dp/', 
        blank=True, 
        null=True
    )
    cover_image = models.ImageField(
        upload_to='communities/cover/', 
        blank=True, 
        null=True
    )
    
    # Relations
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_communities'
    )
    
    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Stats
    member_count = models.IntegerField(default=0)
    
    class Meta:
        verbose_name = 'Community'
        verbose_name_plural = 'Communities'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    
    def update_member_count(self):
        """Update the member count based on memberships"""
        self.member_count = self.members.count()
        self.save(update_fields=['member_count'])


class CommunityMembership(models.Model):
    """Track community memberships"""
    ROLE_CHOICES = [
        ('member', 'Member'),
        ('moderator', 'Moderator'),
        ('admin', 'Admin'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='community_memberships'
    )
    community = models.ForeignKey(
        Community,
        on_delete=models.CASCADE,
        related_name='members'
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='member')
    joined_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        unique_together = ['user', 'community']
        ordering = ['-joined_at']
    
    def __str__(self):
        return f"{self.user.username} in {self.community.name}"
