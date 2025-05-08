from django.contrib.auth.management.commands import createsuperuser
from django.core.management import CommandError
from ...models import User

class Command(createsuperuser.Command):
    def add_arguments(self, parser):
        super().add_arguments(parser)
        parser.add_argument(
            '--role',
            dest='role',
            type=str,
            choices=['DOCTOR', 'PATIENT'],
            help='Specify the user role (DOCTOR or PATIENT)',
        )

    def handle(self, *args, **options):
        role = options.get('role')
        if not role:
            raise CommandError('You must specify a role with --role (e.g., --role DOCTOR)')
        if role not in ['DOCTOR', 'PATIENT']:
            raise CommandError('Role must be either "DOCTOR" or "PATIENT"')

        options['role'] = role  # Добавляем role в options, чтобы передать его в create_superuser
        super().handle(*args, **options)