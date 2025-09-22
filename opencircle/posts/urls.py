from django.urls import path
from .views import create_post, like_post, comment_post, share_post, delete_post, edit_post

urlpatterns = [
    path('create/', create_post, name='create-post'),
    path('like/<int:post_id>/', like_post, name='like-post'),
    path('comment/<int:post_id>/', comment_post, name='comment-post'),
    path('share/<int:post_id>/', share_post, name='share-post'),
    path('delete/<int:post_id>/', delete_post, name='delete-post'),
    path('edit/<int:post_id>/', edit_post, name='edit-post'),

]
