# Strapi cũ — hướng dẫn khôi phục / tham khảo

CMS đang dùng đã chuyển sang Sanity. Tài liệu này chỉ dành cho bản Strapi local dự phòng; hướng dẫn hiện hành ở `CMS-GUIDE.md`.

## Mở và chạy local

- Website: http://localhost:8008/
- CMS: http://localhost:1337/admin (hoặc http://localhost:8008/admin)
- Đây là **Strapi 5.60.0 Community thật**, không phải giao diện mô phỏng.

Hai tiến trình cần chạy đồng thời. Từ thư mục dự án, mở hai terminal:

```powershell
npm install
npm --prefix cms install
npm run dev
```

Terminal thứ hai:

```powershell
npm run cms
```

Tài khoản admin đầu tiên do chủ website tự tạo. Không có mật khẩu mặc định trong mã nguồn. Thông tin tài khoản và nội dung lưu trong SQLite local `cms/.tmp/data.db`, không phải Supabase. Supabase vẫn chỉ nhận các form tư vấn, câu hỏi và ứng tuyển mentor.

## Nhân sự sửa nội dung

1. Vào **Content Manager → Trang website**.
2. Chọn trang cần sửa. Có 10 nội dung trang; hai đường dẫn Mentor dùng chung một nội dung.
3. Mở **Các phần trên trang**, chọn phần theo tiêu đề đang thấy trên website.
4. Mở **Nội dung chữ**, chọn đoạn theo nhãn và sửa **Nội dung hiển thị**. Có thể xuống dòng; không cần viết HTML.
5. Bấm **Save** để lưu nháp. Nút **Xem bản nháp — tab mới** ở khung **Xem trước website GSJ** mở bản nháp, không thay đổi trang đang công khai. Cho phép mở tab mới nếu trình duyệt chặn popup. Nút này hoạt động độc lập với khung Preview nhúng của Strapi, vốn có thể không hiển thị trong một số phiên Chrome.
6. Khi đã kiểm tra, bấm **Publish**. Tải lại website để thấy nội dung vừa xuất bản.

Trường **Tên trang / Tên phần / Nhãn nội dung** dùng để nhận diện trong CMS. Chữ hiển thị trên web nằm trong **Nội dung hiển thị**. Các mã ánh xạ và slug đã được ẩn để tránh sửa nhầm. Giữ nguyên các phần và phần tử có sẵn; CMS này chỉnh nội dung/ảnh trong bố cục hiện tại, không phải công cụ kéo-thả thiết kế trang mới.

## Thay ảnh

1. Trong phần tương ứng, mở **Hình ảnh** và chọn ảnh theo tên.
2. Bấm **Chọn / thay ảnh**: chọn ảnh trong Media Library hoặc tải ảnh mới lên.
3. Sửa **Mô tả ảnh (alt)** cho đúng nội dung ảnh, rồi Save → Preview → Publish.

Đã nhập 64 ảnh raster gốc vào Media Library. Năm logo SVG hiện có tiếp tục dùng bản tĩnh; có thể thay bằng PNG/WebP/JPG qua trường ảnh. Không bật tải SVG tùy ý vì rủi ro nội dung thực thi. Không xóa ảnh còn được trang khác sử dụng. Ảnh chân dung có khung hiển thị riêng để tránh cắt tóc.

## Logo, menu và chân trang

Vào **Content Manager → Cài đặt toàn website**. Các phần **Đầu trang — logo & menu**, **Menu sidebar**, **Chân trang — liên hệ & địa chỉ** dùng chung cho mọi trang. Save và Publish tại đây, không phải sửa lần lượt từng trang.

## Phân quyền nhân sự

Chủ tài khoản dùng **Settings → Administration Panel → Users / Roles** để mời nhân sự và phân quyền. Với nhân sự biên tập, cấp quyền đọc/sửa nội dung và Media Library; chỉ cấp Publish cho người duyệt. Không cấp quyền quản lý tài khoản, API token hoặc Content-Type Builder cho nhân sự chỉ sửa nội dung. Không chia sẻ tài khoản Super Admin. Việc mời người dùng cần email của từng người; dự án không tự tạo tài khoản nhân sự.

## Bảo mật và dữ liệu

- Khách truy cập chỉ đọc được **bản đã Publish** qua `/api/website/:slug`. Tham số `status=draft` không mở được bản nháp.
- API CRUD và tải ảnh không mở cho anonymous. CMS dùng cơ chế đăng nhập và quyền admin nguyên bản của Strapi.
- Preview ký HMAC, ràng buộc với một tài liệu, hết hạn sau 10 phút. Token nằm trong URL fragment để không bị ghi vào log HTTP; chỉ chia sẻ link preview với người được phép xem nháp.
- Web luôn có HTML tĩnh dự phòng nếu CMS bị tắt. Khi CMS chạy lại, tải lại trang để lấy bản Publish mới nhất. Không chạy renderer để cập nhật nội dung hằng ngày; nhân sự làm việc trong Strapi.
- Server web local chỉ phục vụ file web/ảnh được cho phép, chặn `.env`, `.git`, database và thư mục backend. Không dùng `serve .` ở gốc repo sau khi có CMS.
- Sao lưu **cả** `cms/.tmp/data.db` và `cms/public/uploads/` khi đã dừng CMS; không chỉ sao lưu mã nguồn. Có thể dùng lệnh export của Strapi theo tài liệu chính thức. Các file này bị bỏ qua trong Git; không được xóa chúng khi cài lại.
- `cms/.env` chứa khóa bí mật được tạo lúc cài đặt và không đưa vào Git. `cms/.env.example` chỉ là mẫu, phải thay mọi khóa mẫu nếu cài máy mới.

## Đưa lên cho nhân sự dùng từ xa

Bản này đang chạy **local trên máy này**, chưa phải CMS online. Cần một server chạy Node.js lâu dài, HTTPS, cơ sở dữ liệu và nơi lưu ảnh bền vững; không triển khai Strapi như một site HTML tĩnh. Với production nên dùng PostgreSQL và storage phù hợp, cấu hình `CLIENT_URL`, `CMS_PUBLIC_URL`, `CMS_ALLOWED_ORIGINS` cùng URL trong `cms-config.js`, giới hạn truy cập admin và cấu hình email gửi lời mời/khôi phục mật khẩu. Không đưa các khóa Strapi vào JavaScript frontend. Không tự nâng gói hoặc thuê dịch vụ khi chưa chọn hosting.

## Kiểm tra

```powershell
npm run check
node scripts/check-cms-integration.cjs
```

Kiểm tra tích hợp khởi chạy Strapi tạm ở cổng 1347 với database và upload riêng trong `artifacts/cms-tests/`. Nó thử lưu nháp, cách ly nháp, preview có chữ ký, publish, upload/đọc ảnh, chặn ghi anonymous và unpublish. Không thay đổi dữ liệu CMS đang dùng hoặc gửi form vào Supabase.

Nguồn kỹ thuật: [Strapi CLI](https://docs.strapi.io/cms/cli), [Draft & Publish](https://docs.strapi.io/cms/features/draft-and-publish), [Preview](https://docs.strapi.io/cms/features/preview), [RBAC](https://docs.strapi.io/cms/features/rbac).
