import sys
import os
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect('187.124.167.233', username='root', password='Struct123456@')
    
    stdin, stdout, stderr = ssh.exec_command('tail -n 35 /var/www/struct2/backendoi2/api/views.py')
    print("Server views.py tail:")
    print(stdout.read().decode())
    
except Exception as e:
    print("Error:", e)
finally:
    ssh.close()
