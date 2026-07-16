/**
 * Embeddings Accuracy Test Runner
 *
 * This script evaluates the retrieval accuracy of different embedding models across 4 cases:
 * 1. English to English
 * 2. Vietnamese to Vietnamese
 * 3. English to Vietnamese (Cross-lingual)
 * 4. Vietnamese to English (Cross-lingual)
 *
 * Usage:
 *   node test_embeddings.js
 */

// ==========================================
// 1. CONFIGURATION
// ==========================================
const MODEL_NAME = "qwen3-embedding:0.6b"; // Change this to the model you want to test
const OLLAMA_BASE_URL = "http://localhost:11434";
const SIMILARITY_THRESHOLD = 0.2;

// ==========================================
// 2. MODEL PREFIX CONFIGURATION
// ==========================================
const NOMIC_PREFIXED_MODELS = ["nomic-embed-text"];
const QWEN_PREFIXED_MODELS = ["qwen3-embedding", "qwen2.5-embedding", "qwen-embedding"];
const GEMMA_PREFIXED_MODELS = ["embeddinggemma"];

function getDocumentPrefix(model) {
  if (NOMIC_PREFIXED_MODELS.some(p => model.includes(p))) return "search_document: ";
  if (GEMMA_PREFIXED_MODELS.some(p => model.includes(p))) return "title: none | text: ";
  return "";
}

function getQueryPrefix(model) {
  if (NOMIC_PREFIXED_MODELS.some(p => model.includes(p))) return "search_query: ";
  if (QWEN_PREFIXED_MODELS.some(p => model.includes(p))) {
    return "Instruct: Given a query, retrieve the most relevant passage.\nQuery: ";
  }
  if (GEMMA_PREFIXED_MODELS.some(p => model.includes(p))) {
    return "task: search result | query: ";
  }
  return "";
}

// ==========================================
// 3. MOCK DATA (30 entries, mixed languages, < 50 words per line)
// ==========================================
const ENTRIES = [
  {
    date: "2026-07-01",
    content: "looking for a new place to stay.\nthe current room is too small and noisy.\nneed to move out by next week."
  },
  {
    date: "2026-07-02",
    content: "went to the gym today to work on my squat.\nfelt very tired but satisfying.\nneed to maintain a healthy lifestyle."
  },
  {
    date: "2026-07-03",
    content: "working on a project using react and tauri.\nit's a desktop app for journal management.\nhope to finish it soon."
  },
  {
    date: "2026-07-04",
    content: "mình ngồi quán cà phê cả chiều nay.\nthời tiết sài gòn dạo này hay mưa bất chợt.\nuống bạc xỉu và đọc sách rất chill."
  },
  {
    date: "2026-07-05",
    content: "studied for my final exam all night.\nso tired of these engineering courses.\njust want to graduate and start working."
  },
  {
    date: "2026-07-06",
    content: "hôm nay ăn mì tôm trứng cho qua bữa.\nhết tiền cuối tháng nên phải tiết kiệm thôi.\nnhưng mì tôm vẫn rất ngon."
  },
  {
    date: "2026-07-07",
    content: "girlfriend was upset today because her cat is sick.\ni feel so worried for her.\ntrying my best to comfort her."
  },
  {
    date: "2026-07-08",
    content: "đường từ ký túc xá đến trường hơi kẹt xe.\nsáng nào cũng phải dậy từ 6h để kịp giờ học.\nthực sự rất mệt mỏi."
  },
  {
    date: "2026-07-09",
    content: "went shopping with my family today.\nbought some new clothes for the summer vacation.\nhad a great dinner afterwards."
  },
  {
    date: "2026-07-10",
    content: "lo lắng về kết quả phỏng vấn ngày mai.\nhy vọng mọi chuyện sẽ diễn ra suôn sẻ.\nkhông ngủ được vì bồn chồn."
  },
  {
    date: "2026-07-11",
    content: "had a delicious hotpot with friends.\nwe talked about our plans after graduation.\nsome want to study abroad, some want to work."
  },
  {
    date: "2026-07-12",
    content: "mưa to quá không đi đâu được.\nở nhà cày phim và ăn bánh mì pate.\nthấy bình yên ghê."
  },
  {
    date: "2026-07-13",
    content: "had to wake up early for a meeting.\nthe boss was complaining about the low sales.\nstressful monday morning."
  },
  {
    date: "2026-07-14",
    content: "chạy bộ quanh công viên vào buổi tối.\nkhông khí mát mẻ giúp giải tỏa căng thẳng.\nsẽ cố duy trì thói quen này."
  },
  {
    date: "2026-07-15",
    content: "bought some instant noodles from the supermarket.\nthey are cheap and easy to cook when working late.\nmy favorite is the spicy seafood flavor."
  },
  {
    date: "2026-07-16",
    content: "đang tìm phòng trọ mới quanh quận 10.\ngiá thuê dạo này đắt quá chừng.\ncần tìm người ở ghép để chia tiền."
  },
  {
    date: "2026-07-17",
    content: "dog was barking all night because of the storm.\ncould not get enough sleep.\nnow my head hurts."
  },
  {
    date: "2026-07-18",
    content: "completed the first draft of my thesis.\nmy advisor gave some feedback today.\nstill have a lot to edit."
  },
  {
    date: "2026-07-19",
    content: "hôm nay là sinh nhật của mẹ.\ncả nhà đi ăn nhà hàng hải sản.\nmẹ rất vui và hạnh phúc."
  },
  {
    date: "2026-07-20",
    content: "feels good to clean up the room today.\ndiscarded a lot of old books and clothes.\nminimalist lifestyle is great."
  },
  {
    date: "2026-07-21",
    content: "học nhóm với bạn ở thư viện trường.\nthư viện máy lạnh mát mẻ tập trung tốt hơn ở nhà.\ncòn vài tuần nữa là thi rồi."
  },
  {
    date: "2026-07-22",
    content: "forgot my umbrella and got soaked in the rain.\nnow i have a slight fever.\nhope it doesn't get worse."
  },
  {
    date: "2026-07-23",
    content: "cảm thấy bồn chồn lo âu không rõ lý do.\ncó lẽ dạo này áp lực công việc quá nhiều.\ncần nghỉ ngơi một chút."
  },
  {
    date: "2026-07-24",
    content: "cooked spaghetti for dinner.\nit turned out really delicious.\npracticing my cooking skills."
  },
  {
    date: "2026-07-25",
    content: "ký túc xá trường mình dạo này hay mất nước.\nsinh hoạt rất bất tiện và khó chịu.\nmuốn dời ra ngoài thuê phòng riêng."
  },
  {
    date: "2026-07-26",
    content: "went to the cinema to watch the new action movie.\nthe plot was generic but the visual effects were amazing.\nworth the ticket price."
  },
  {
    date: "2026-07-27",
    content: "mì tôm là món ăn quốc dân mỗi khi lười nấu nướng.\nchỉ cần 3 phút là có ngay bữa ăn nóng hổi.\nnhưng ăn nhiều không tốt cho sức khỏe đâu."
  },
  {
    date: "2026-07-28",
    content: "worrying about my financial situation.\nneed to find a part-time job soon.\nexpenses are getting higher."
  },
  {
    date: "2026-07-29",
    content: "chơi game cùng đám bạn thân thiết.\ncười nói vui vẻ quên hết mệt mỏi.\ngame này đòi hỏi phối hợp đồng đội cao."
  },
  {
    date: "2026-07-30",
    content: "finally graduated from university today!\nfour years of hard work paid off.\nso excited for the next chapter of my life."
  }
];

// ==========================================
// 4. TEST CASES DEFINITION (With ground truths)
// ==========================================
const TEST_CASES = [
  {
    id: 1,
    name: "English to English",
    query: "college graduation",
    groundTruths: [
      { date: "2026-07-30", line: 1 }, // "finally graduated from university today!"
      { date: "2026-07-05", line: 3 }  // "just want to graduate and start working."
    ]
  },
  {
    id: 2,
    name: "Vietnamese to Vietnamese",
    query: "nơi ở ký túc xá",
    groundTruths: [
      { date: "2026-07-08", line: 1 }, // "đường từ ký túc xá đến trường hơi kẹt xe."
      { date: "2026-07-25", line: 1 }, // "ký túc xá trường mình dạo này hay mất nước."
      { date: "2026-07-16", line: 1 }  // "đang tìm phòng trọ mới quanh quận 10."
    ]
  },
  {
    id: 3,
    name: "English to Vietnamese (Cross-lingual)",
    query: "instant noodles",
    groundTruths: [
      { date: "2026-07-06", line: 1 }, // "hôm nay ăn mì tôm trứng cho qua bữa."
      { date: "2026-07-27", line: 1 }  // "mì tôm là món ăn quốc dân..."
    ]
  },
  {
    id: 4,
    name: "Vietnamese to English (Cross-lingual)",
    query: "lo lắng buồn phiền",
    groundTruths: [
      { date: "2026-07-07", line: 2 }, // "i feel so worried for her."
      { date: "2026-07-28", line: 1 }  // "worrying about my financial situation."
    ]
  }
];

// ==========================================
// 5. MATH HELPER FUNCTIONS
// ==========================================
function dotProduct(a, b) {
  let sum = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

// ==========================================
// 6. OLLAMA API FETCH HELPER
// ==========================================
async function fetchEmbeddings(texts, model, prefix = "") {
  const prefixedTexts = prefix ? texts.map(t => prefix + t) : texts;
  
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, input: prefixedTexts })
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.embeddings;
  } catch (error) {
    console.error(`Failed to fetch embeddings for model ${model}:`, error.message);
    process.exit(1);
  }
}

// ==========================================
// 7. RUNNER CORE LOGIC
// ==========================================
async function run() {
  console.log(`\n==========================================`);
  console.log(`🚀 STARTING EVALUATION FOR MODEL: ${MODEL_NAME}`);
  console.log(`==========================================\n`);

  // Parse lines to index
  const chunksToEmbed = [];
  for (const entry of ENTRIES) {
    const lines = entry.content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const text = lines[i].trim();
      const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
      if (text.length > 0 && wordCount >= 4) {
        chunksToEmbed.push({
          date: entry.date,
          line_number: i + 1,
          text
        });
      }
    }
  }

  console.log(`Parsing mock entries... Found ${chunksToEmbed.length} indexable lines.`);
  console.log(`Generating document embeddings... (This might take a few seconds)`);

  const docPrefix = getDocumentPrefix(MODEL_NAME);
  const docTexts = chunksToEmbed.map(c => c.text);
  const docVectors = await fetchEmbeddings(docTexts, MODEL_NAME, docPrefix);

  // Attach vectors to chunks
  chunksToEmbed.forEach((chunk, index) => {
    chunk.vector = docVectors[index];
  });

  console.log(`✅ Document index built successfully.\n`);
  console.log(`==========================================`);
  console.log(`📊 RUNNING THE 4 EVALUATION TEST CASES`);
  console.log(`==========================================`);

  const queryPrefix = getQueryPrefix(MODEL_NAME);

  for (const testCase of TEST_CASES) {
    console.log(`\n------------------------------------------`);
    console.log(`Case ${testCase.id}: ${testCase.name}`);
    console.log(`Query: "${testCase.query}" (Query Prefix used: "${queryPrefix.replace(/\n/g, '\\n')}")`);
    console.log(`------------------------------------------`);

    const queryVectors = await fetchEmbeddings([testCase.query], MODEL_NAME, queryPrefix);
    const queryVector = queryVectors[0];

    // Compute similarities
    const results = chunksToEmbed.map(chunk => {
      const similarity = dotProduct(queryVector, chunk.vector);
      return {
        ...chunk,
        similarity
      };
    });

    // Filter and Sort
    const filteredResults = results
      .filter(r => r.similarity >= SIMILARITY_THRESHOLD)
      .sort((a, b) => b.similarity - a.similarity);

    // Print top 5 results
    const topResults = filteredResults.slice(0, 5);
    
    topResults.forEach((res, rank) => {
      // Check if this result matches any ground truth
      const isGroundTruth = testCase.groundTruths.some(
        gt => gt.date === res.date && gt.line === res.line_number
      );
      
      const statusMarker = isGroundTruth ? "🟢 [MATCH]" : "   [NOISE]";
      console.log(
        `#${rank + 1} | ${(res.similarity * 100).toFixed(1)}% Match | ${res.date} Line ${res.line_number} ${statusMarker}\n` +
        `    Text: "${res.text}"`
      );
    });

    if (topResults.length === 0) {
      console.log(`⚠️ No matches found above similarity threshold of ${SIMILARITY_THRESHOLD * 100}%`);
    }

    // Evaluate Pass/Fail
    // We pass if at least one of our ground truths is retrieved in the top 3 results
    const top3 = topResults.slice(0, 3);
    const foundGroundTruths = testCase.groundTruths.filter(gt =>
      top3.some(res => res.date === gt.date && res.line_number === gt.line)
    );

    const score = `${foundGroundTruths.length}/${testCase.groundTruths.length}`;
    if (foundGroundTruths.length > 0) {
      console.log(`\n🎉 STATUS: PASS (${score} expected matches found in top 3)`);
    } else {
      console.log(`\n❌ STATUS: FAIL (0/${testCase.groundTruths.length} expected matches in top 3)`);
    }
  }

  console.log(`\n==========================================`);
  console.log(`🏁 EVALUATION COMPLETE`);
  console.log(`==========================================\n`);
}

run();
