# IELTS Vocabulary CSV Generator Agent

## Directory Structure

```text
.
├── AGENTS.MD
├── /input
├── /choice-question
└── /fill-the-blank
```

### AGENTS.MD

Tài liệu mô tả quy tắc hoạt động của Agent, các format input và output.

### Folder /input

Chứa danh sách từ vựng đầu vào.

Ví dụ:

```text
nocturnal = night‑active, after‑dark, nighttime
critically = dangerously, seriously, severely
endangered = highly threatened, on the brink of extinction, scarce
unique = unusual, uncommon, distinctive
```

Mỗi dòng là một từ hoặc cụm từ cần được chuyển đổi thành các câu hỏi tương ứng theo yêu cầu.

### Folder /choice-question

Thư mục chứa các file CSV đầu ra là các câu hỏi dạng trắc nghiệm.

### Folder /fill-the-blank

Thư mục chứa các file CSV đầu ra là các câu hỏi dạng điền vào chỗ trống.

---

## CSV Format

### Choice Question

Mỗi file CSV của dạng "Choice Question" phải tuân thủ chính xác thứ tự cột sau:

```csv
number,question,a,b,c,d,e,f,g,h,i,j,answers,ref,explanation
```

Trong đó, nội dung các cột phải tuân thủ quy tắc dưới đây:

#### number

* Sử dụng số thứ tự tăng dần (bắt đầu từ 1) nối với tên của file input.
* Phải unique cho mỗi record.
* Tăng dần theo thứ tự record.

Ví dụ:

```text
1-CAM20-TEST1-PASSAGE1
2-CAM20-TEST1-PASSAGE1
3-CAM20-TEST1-PASSAGE1
...
100-CAM20-TEST1-PASSAGE1
```

#### question

Agent phải hỗ trợ 2 loại câu hỏi cho dạng Choice Question này:

##### Type 1 - Definition => Vocabulary

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

1. Cambridge Dictionary (ưu tiên).
2. Oxford Dictionary.
3. Hoặc tự paraphrase theo nghĩa chuẩn nếu không tìm được định nghĩa phù hợp.

Yêu cầu:

* Viết hoa chữ cái đầu.
* Ngắn gọn, dễ hiểu.
* Chỉ có một đáp án đúng.
* Agent phải tạo đủ dữ liệu cho cả Type 1 và Type 2.

##### Type 2 - Vietnamese Meaning => Vocabulary

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

#### Các cột từ "a" tới "j"

Quy tắc:

* Chỉ sử dụng các cột: a, b, c, d.
* Chỉ có 4 đáp án lựa chọn cho mỗi câu hỏi.
* Các cột còn lại (e, f, g, h, i, j) phải để trống:

Ví dụ:

```csv
1-CAM20-TEST1-PASSAGE1,"Question","Option A","Option B","Option C","Option D","","","","","",""
```

* Chỉ có duy nhất một đáp án đúng.
* Các đáp án nhiễu phải cùng loại từ (noun, verb, adjective, adverb...) nếu có thể.
* Ưu tiên các từ có liên quan về chủ đề hoặc ngữ nghĩa.

#### answers

Là tên cột chứa đáp án đúng của các cột lựa chọn (a, b, c, d). Không ghi từ vựng vào cột này.


#### ref

Luôn để trống cột này.

### Fill The Blank

Mỗi file CSV của dạng "Fill The Blank" phải tuân thủ chính xác thứ tự cột sau:

```csv
number,question,answers,explanation
```

Trong đó, nội dung các cột phải tuân thủ quy tắc dưới đây:

#### number

Định dạng cột này tương tự như cột number ở dạng "Choice Question", thứ tự sẽ được tiếp tục từ Choice Question.

#### question

Tạo dạng câu hỏi cho bài tập điền từ. Format tương tự cột question thuộc dạng "Choice Question".

Ví dụ:

```html
<div>
  <b>Complete the sentence by typing correct words:</b>
  <p>My name __ John.</p>
</div>
```

#### answer

Đây là cột chứa thông tin câu trả lời chính xác, chuyển đổi thành dạng lowercase.

---

## Explanation Format Requirement

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

Sử dụng IPA chuẩn quốc tế (tham khảo từ điển Cambridge).

### CEFR

Được đánh dấu dựa theo các loại sau:

```text
A1
A2
B1
B2
C1
C2
```
