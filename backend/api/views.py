from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status, generics, filters
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from django.db.models import Sum, F
from .models import Product, Category
from .serializers import ProductSerializer, CategorySerializer

# ==========================================
# 1. AUTHENTICATION
# ==========================================
@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response({'error': 'Please provide both username and password'}, status=status.HTTP_400_BAD_REQUEST)
        
    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
        
    user = User.objects.create_user(username=username, password=password)
    token, created = Token.objects.get_or_create(user=user)
    return Response({'token': token.key}, status=status.HTTP_201_CREATED)


# ==========================================
# 2. DASHBOARD STATS CARD ENDPOINT
# ==========================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    user_products = Product.objects.filter(user=request.user)
    
    total_products = user_products.count()
    total_categories = user_products.values('category_id').distinct().count()
    
    inventory_calc = user_products.annotate(
        total_value=F('price') * F('stock_quantity')
    ).aggregate(grand_total=Sum('total_value'))['grand_total'] or 0.00

    return Response({
        "total_products": total_products,
        "total_categories": total_categories,
        "inventory_value": float(inventory_calc)
    })


# ==========================================
# 3. PRODUCT MANAGEMENT (List & Create)
# ==========================================
class ProductListCreate(generics.ListCreateAPIView):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['price']

    def get_queryset(self):
        queryset = Product.objects.filter(user=self.request.user).order_by('-created_at')
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ==========================================
# 4. PRODUCT DETAIL MANAGEMENT (Read, Update, Delete)
# ==========================================
class ProductDetail(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Product.objects.filter(user=self.request.user)


# ==========================================
# 5. CATEGORY ACCESSIBILITY
# ==========================================
class CategoryListCreate(generics.ListCreateAPIView):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Category.objects.all()
