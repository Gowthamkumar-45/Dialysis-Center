import threading

_thread_locals = threading.local()


def get_current_request():
    return getattr(_thread_locals, 'request', None)


def get_current_user():
    """
    Resolve the authenticated user lazily — DRF token auth populates
    request.user inside the view, AFTER this middleware has run, so we
    keep a reference to the request object itself and look it up on demand.
    """
    request = get_current_request()
    if request is None:
        return None
    user = getattr(request, 'user', None)
    if user is None or not getattr(user, 'is_authenticated', False):
        return None
    return user


def get_current_ip():
    request = get_current_request()
    if request is None:
        return None
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if forwarded:
        return forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


class CurrentRequestMiddleware:
    """
    Stashes the current request into thread-local storage so that signal
    handlers (which have no request access) can attribute activity-log
    entries to the right person — even when DRF resolves request.user
    later, inside the view.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        _thread_locals.request = request
        try:
            return self.get_response(request)
        finally:
            _thread_locals.request = None

    @staticmethod
    def _client_ip(request):
        forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
        if forwarded:
            return forwarded.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')
