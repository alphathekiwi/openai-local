from django.shortcuts import render

# Create your views here.
def home(request):
    print(request.build_absolute_uri()) #optional
    return render(
        request,
        'home.html',
        {
            'name': "name",
            'date': "datetime.now()"
        }
    )
