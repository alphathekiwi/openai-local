from django.shortcuts import render
from chatgpt_clone.models import Conversation, Message


# Create your views here.
def home(request):
    conversations = Conversation.objects.all()
    return render(request, 'home.html', {'conversations': conversations})
