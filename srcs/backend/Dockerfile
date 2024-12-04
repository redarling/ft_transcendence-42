FROM python:3.11

RUN apt update && apt install -y postgresql-client cron

WORKDIR /app

COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app/

COPY ./cronjobs /etc/cron.d/cronjobs

RUN chmod 0644 /etc/cron.d/cronjobs

RUN crontab /etc/cron.d/cronjobs

CMD cron && python app/manage.py makemigrations && python app/manage.py migrate && python app/manage.py runserver 0.0.0.0:8000
