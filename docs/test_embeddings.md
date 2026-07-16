# Semantic Search Embedding Test Cases

This document compiles realistic semantic search queries and expected matches based on the current journal export data. Use these test cases to verify the retrieval quality of different local embedding models (e.g., Gemma, Nomic, Qwen).

---

## 1. English to English (EN to EN)

Matches where both the search query and the target journal entry are written in English.

| Query | Expected Target Sentence | Date |
| :--- | :--- | :--- |
| **`"fantasy video games"`** | `"i do love to be a knight in a fantasy movie, fighting dragon, save my girl and all, thats why i've been playing skyrim lately..."` | `2026-07-09` |
| **`"pull up target"`** | `"this time i managed to do 30 minutes active hang with some scap pull-ups. the process is slow... the goal now is to do one clean pull up."` | `2026-07-10` |
| **`"bad wedding catering"`** | `"yesterday in phan thiet was a fun day... but today is the opposite lmao, the wedding food is so bad"` | `2026-07-04` |

---

## 2. English to Vietnamese (EN to VN) — Cross-lingual

Matches where the search query is in English, but the target journal entry is in Vietnamese.

| Query | Expected Target Sentence | Date |
| :--- | :--- | :--- |
| **`"instant noodles at the cafe"`** | `"mình ngồi quán nước từ chiều đến đến tối luôn, mì tôm ở đây ngon cực..."` | `2026-07-06` |
| **`"cute cat at the shop"`** | `"mình ngồi quán nước... quán này cũng có con mèo dễ thương ghê."` | `2026-07-06` |
| **`"long walk back to dormitory"`** | `"đường đi từ quán nước về lại ký túc xá của mình thì hơi xa."` | `2026-07-06` |

---

## 3. Vietnamese to Vietnamese (VN to VN)

Matches where both the search query and the target journal entry are written in Vietnamese.

| Query | Expected Target Sentence | Date |
| :--- | :--- | :--- |
| **`"ăn mì tôm ngắm mèo"`** | `"mình ngồi quán nước từ chiều đến đến tối luôn, mì tôm ở đây ngon cực... quán này cũng có con mèo dễ thương ghê."` | `2026-07-06` |
| **`"đường về ký túc xá"`** | `"đường đi từ quán nước về lại ký túc xá của mình thì hơi xa."` | `2026-07-06` |

---

## 4. Vietnamese to English (VN to EN) — Cross-lingual

Matches where the search query is in Vietnamese, but the target journal entry is in English.

| Query | Expected Target Sentence | Date |
| :--- | :--- | :--- |
| **`"tìm phòng trọ bên ngoài"`** | `"i am looking for a rented room to stay, because the dormitory dont fit me anymore"` | `2026-07-01` |
| **`"bài tập hít xà đơn"`** | `"this time i managed to do 30 minutes active hang with some scap pull-ups... the goal now is to do one clean pull up."` | `2026-07-10` |
| **`"hiệp sĩ bên đống lửa"`** | `"sometimes i feel like a knight sitting near a campfire..."` | `2026-07-09` |
