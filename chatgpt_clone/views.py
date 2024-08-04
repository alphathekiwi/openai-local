from django.shortcuts import redirect, render
from chatgpt_clone.models import Conversation, Message


# Create your views here.
def home(request):
    conversations = Conversation.objects.all()
    convo_id: str = request.GET.get('id')
    if not (convo_id and convo_id.isdigit()):
        newest = conversations.latest('id')
        if newest and newest.current_message == 0:
            return redirect(f'/?id={newest.id}')
    return render(request, 'home.html', {'conversations': conversations})
