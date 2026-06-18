from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status, generics, filters
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from django.db.models import Sum, F
from .models import Product, Category
from .serializers import ProductSerializer, CategorySerializer

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

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    user_products = Product.objects.filter(user=request.user)
    total_products = user_products.count()
    total_categories = user_products.filter(category__isnull=False).values('category').distinct().count()
    
    inventory_calc = user_products.annotate(
        total_value=F('price') * F('stock_quantity')
    ).aggregate(grand_total=Sum('total_value'))['grand_total'] or 0.00

    return Response({
        "total_products": total_products,
        "total_categories": total_categories,
        "inventory_value": float(inventory_calc)
    })

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

class ProductDetail(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Product.objects.filter(user=self.request.user)

class CategoryListCreate(generics.ListCreateAPIView):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # FIXED: Run the check natively without modifying or rebuilding the clean queryset scope variable
        if not Category.objects.exists():
            categories = [
                'Electronics', 'Clothing', 'Groceries', 'Home Appliances', 
                'Books', 'Health & Beauty', 'Automotive', 'Toys & Games', 
                'Sports & Outdoors', 'Office Supplies', 'Furniture', 'Other'
            ]
            for cat_name in categories:
                Category.objects.get_or_create(name=cat_name)
                
        # Return a completely pristine, unmutated lazy queryset matching DRF expectations
        return Category.objects.all()
