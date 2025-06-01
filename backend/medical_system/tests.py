# medical_system/tests.py
from rest_framework.test import APIClient, APITestCase
from medical_system.models import User
from django.urls import reverse

class AuthenticationTestCase(APITestCase):
    def setUp(self):
        """Настройка перед каждым тестом"""
        self.client = APIClient()
        # Создаём тестового пользователя для тестов входа
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User',
            role='PATIENT',
            phone='+79998887766',
            inn='123456789012',
            # username='testuser' # username не нужен, если USERNAME_FIELD = 'email'
            is_active=True
        )
        # URL-адреса для тестирования (simple_jwt и UserViewSet)
        self.login_url = reverse('token_obtain_pair')
        self.register_url = reverse('user-list')

    def test_successful_registration(self):
        """Тест успешной регистрации нового пользователя"""
        data = {
            'email': 'newuser@example.com',
            'password': 'newpass123',
            'first_name': 'New',
            'last_name': 'User',
            'role': 'PATIENT',
            'phone': '+79001112233',
            'inn': '987654321098'
        }
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, 201, msg=f"Registration failed with data: {response.data}")
        self.assertTrue(User.objects.filter(email='newuser@example.com').exists())
        self.assertIn('email', response.data) # UserViewSet возвращает созданный объект

    # def test_registration_with_mismatched_passwords(self):
    #     """Тест регистрации с несовпадающими паролями - требует кастомной логики в UserSerializer"""
    #     data = {
    #         'email': 'newuser2@example.com',
    #         'password': 'newpass123', 
    #         'password_confirm': 'wrongpass123', # Пример, если бы сериализатор поддерживал это
    #         'first_name': 'New2',
    #         'last_name': 'User2',
    #         'role': 'PATIENT',
    #         'phone': '+79001112244',
    #         'inn': '987654321099'
    #     }
    #     response = self.client.post(self.register_url, data, format='json')
    #     self.assertEqual(response.status_code, 400)
    #     # self.assertIn('password_confirm', response.data) # Зависит от реализации сериализатора

    def test_successful_login(self):
        """Тест успешного входа"""
        data = {
            'email': self.user.email,
            'password': 'testpass123',
        }
        response = self.client.post(self.login_url, data, format='json')
        self.assertEqual(response.status_code, 200, msg=f"Login failed with content: {response.content}")
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user_role', response.data)
        self.assertIn('user_id', response.data)
        self.assertIn('full_name', response.data)

    def test_failed_login_with_wrong_password(self):
        """Тест неудачного входа с неверным паролем"""
        data = {
            'email': self.user.email,
            'password': 'wrongpass123',
        }
        response = self.client.post(self.login_url, data, format='json')
        # Ожидаем 401 Unauthorized, как должен возвращать simple_jwt или кастомный view при ошибке токена
        self.assertEqual(response.status_code, 401, msg=f"Failed login returned unexpected status. Content: {response.content}")
        self.assertIn('detail', response.data)