bind = "127.0.0.1:8000"
workers = 3
timeout = 120
accesslog = "/var/log/struct/gunicorn-access.log"
errorlog = "/var/log/struct/gunicorn-error.log"
capture_output = True
