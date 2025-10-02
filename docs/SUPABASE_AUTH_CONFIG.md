# Supabase Auth Configuration

Để tự động verify email và login sau khi đăng ký, cần cấu hình trong Supabase Dashboard:

## 1. Authentication Settings

1. Vào Supabase Dashboard → Authentication → Settings
2. Tìm phần "User Signups"
3. Bật "Enable email confirmations" = OFF
4. Hoặc set "Confirm email" = false

## 2. Email Templates (Optional)

Nếu muốn giữ email confirmation nhưng tự động confirm:
1. Vào Authentication → Email Templates
2. Cập nhật "Confirm signup" template
3. Hoặc disable email sending trong Auth settings

## 3. Database Policies

Đảm bảo RLS policies cho phép user mới truy cập:
- Users table: INSERT cho authenticated users
- Images table: INSERT cho authenticated users
- Plans table: INSERT cho authenticated users

## 4. Environment Variables

Đảm bảo có đầy đủ:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
DATABASE_URL=your_database_url
```

## 5. Testing

Sau khi cấu hình:
1. Đăng ký user mới
2. User sẽ tự động được login
3. Không cần verify email
4. Có thể sử dụng app ngay lập tức
