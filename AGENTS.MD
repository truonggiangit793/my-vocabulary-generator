# IELTS Vocabulary CSV Generator Agent

## Objective

Chuyển đổi danh sách từ vựng IELTS từ các file input ở thư mục`/input` thành file CSV lưu ở thư mục `/output` theo đúng định dạng để import vào hệ thống học từ vựng.

---

## Directory Structure

```text
.
├── AGENTS.md
├── /input
└── /output
```

### AGENTS.md

Tài liệu mô tả quy tắc hoạt động của Agent.

### /input

Chứa danh sách từ vựng đầu vào và nghĩa tiếng Việt nếu có.

Ví dụ:

```text
abandon	rời bỏ
absorb	thấm hút, tiếp thu
abundant	dồi dào, phong phú
accomplishment	thành tựu
acknowledge	thừa nhận
acquire	đạt được
```

Mỗi dòng là một từ hoặc cụm từ cần được chuyển đổi thành các câu hỏi trắc nghiệm.

### output.csv

Thư mục chứa các file CSV đầu ra chứa tất cả các câu hỏi trắc nghiệm từ `/input`.

---

## CSV Format

Mỗi file CSV phải tuân thủ chính xác thứ tự cột sau:

```csv
number,question,a,b,c,d,e,f,g,h,i,j,answers,ref,explanation
```

---

## Column Rules

### number

* Sử dụng số thứ tự tăng dần (bắt đầu từ 1).
* Phải unique cho mỗi record.
* Tăng dần theo thứ tự record.

Ví dụ:

```text
1
2
3
...
100
```

---

### question

Agent phải hỗ trợ 2 loại câu hỏi.

#### Type 1 - Definition → Vocabulary

Format:

```html
<div>
  <b>Question description:</b>
  <p>Question details.</p>
</div>
```

Ví dụ:

```html
<div>
  <b>Choose the word that matches the definition:</b>
  <p>A historical person known for documenting and exploring ancient sites.</p>
</div>
```

Definition nên được lấy từ:

1. Cambridge Dictionary (ưu tiên)
2. Oxford Dictionary
3. Hoặc tự paraphrase theo nghĩa chuẩn nếu không tìm được định nghĩa phù hợp

Yêu cầu:

* Viết hoa chữ cái đầu.
* Ngắn gọn, dễ hiểu.
* Chỉ có một đáp án đúng.
* Agent phải tạo đủ dữ liệu cho cả Type 1 và Type 2.

#### Type 2 - Vietnamese Meaning → Vocabulary

Format:

```html
<div>
  <b>Choose the English word that matches the meaning:</b>
  <p>Nghĩa tiếng Việt.</p>
</div>
```

Ví dụ:

```html
<div>
  <b>Choose the English word that matches the meaning:</b>
  <p>Rời bỏ.</p>
</div>
```

Yêu cầu:

* Nghĩa tiếng Việt phải ngắn gọn.
* Chỉ có một đáp án đúng.
* Agent phải tạo đủ dữ liệu cho cả Type 1 và Type 2.

---

### a → j

Quy tắc:

* Chỉ sử dụng các cột:

  * a
  * b
  * c
  * d

* Chỉ có 4 đáp án lựa chọn cho mỗi câu hỏi.

* Các cột còn lại phải để trống:

```csv
e,f,g,h,i,j
```

Ví dụ:

```csv
1,"Question","Option A","Option B","Option C","Option D","","","","","",""
```

* Chỉ có duy nhất một đáp án đúng.
* Các đáp án nhiễu phải cùng loại từ (noun, verb, adjective, adverb...) nếu có thể.
* Ưu tiên các từ có liên quan về chủ đề hoặc ngữ nghĩa.

---

### answers

Là tên cột chứa đáp án đúng.

Ví dụ:

```text
a
b
c
d
```

Không ghi từ vựng vào cột này.

---

### ref

Luôn để trống.

Ví dụ:

```csv
""
```

---

### explanation

Bắt buộc sử dụng HTML.

Format:

```html
<div>
  <h3 class="word">...</h3>
  <p class="type">...</p>
  <div class="ipa">
    <div class="ipa-uk"><b>UK</b><p>...</p></div>
    <div class="ipa-us"><b>US</b><p>...</p></div>
  </div>
  <p class="cerf">...</p>
  <p class="definition">...</p>
  <p class="vietnamese">...</p>
</div>
```

Ví dụ:

```html
<div>
  <h3 class="word">Abandon</h3>
  <p class="type">verb</p>
  <div class="ipa">
    <div class="ipa-uk"><b>UK</b><p>/əˈbæn.dən/</p></div>
    <div class="ipa-us"><b>US</b><p>/əˈbæn.dən/</p></div>
  </div>
  <p class="cerf">B2</p>
  <p class="definition">To leave a place, thing, or person, usually for ever.</p>
  <p class="vietnamese">Từ bỏ, rời bỏ hoặc bỏ rơi một nơi chốn, sự việc, hay con người, thường là vĩnh viễn.</p>
</div>
```

---

## Vocabulary Metadata Rules

### IPA

* Sử dụng IPA chuẩn quốc tế.

### CEFR

Chỉ sử dụng một mức duy nhất:

```text
A1
A2
B1
B2
C1
C2
```

---

## Output Requirements

* Không chứa header CSV.
* Không có dòng trống giữa các record.
* Tất cả nội dung HTML phải được minify.
* Chỉ sử dụng 4 đáp án (a-d).
* Các cột e-j luôn để trống.
* Mỗi từ vựng ở danh sách `/input` phải đầy đủ Type 1 và Type 2.

---

## Workflow

1. Đọc danh sách từ trong thư mục `/input`.
2. Tra cứu nghĩa và định nghĩa chuẩn.
3. Sinh câu hỏi cho mỗi từ phải đủ Type 1 và Type 2.
4. Sinh 4 đáp án lựa chọn (a-d).
5. Xác định cột đáp án đúng.
6. Sinh phần explanation đầy đủ.
7. Ghi kết quả vào file ở `/output`.

---

## Quality Checklist

Trước khi ghi file:

* [ ] number là số thứ tự tăng dần (1, 2, 3, ...).
* [ ] question đúng format HTML.
* [ ] Mỗi từ cần đầy đủ Type 1 và Type 2.
* [ ] Có đúng 4 đáp án từ a-d.
* [ ] e-j để trống.
* [ ] Chỉ có một đáp án đúng.
* [ ] answers chứa tên cột đúng.
* [ ] ref để trống.
* [ ] explanation phải đúng format.
* [ ] Không có header CSV.
* [ ] Không có dòng trống giữa các record.
