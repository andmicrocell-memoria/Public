import axios from "axios";

async function runTest() {
  try {
    console.log("Fetching posts...");
    const res = await axios.get("http://localhost:3000/api/posts");
    console.log("Successfully fetched. Count:", res.data.length);
    console.log("Posts IDs:", res.data.map((p: any) => p.id));
    
    console.log("Testing POST save...");
    const testPost = {
      id: "post-save-test-" + Date.now(),
      title: "Test Saving Post",
      content: "This is test content to see if it is correctly written.",
      category: "Dicas",
      excerpt: "This is an excerpt",
      coverImage: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600",
      publishedAt: new Date().toISOString().split('T')[0],
      views: 0,
      readTime: "2 min"
    };
    
    const postRes = await axios.post("http://localhost:3000/api/posts", testPost);
    console.log("Save Response:", postRes.data);
    
    console.log("Fetching posts again...");
    const res2 = await axios.get("http://localhost:3000/api/posts");
    console.log("Successfully fetched 2. Count:", res2.data.length);
    console.log("Posts IDs 2:", res2.data.map((p: any) => p.id));
  } catch (err: any) {
    console.error("Test failed:", err.message);
    if (err.response) {
      console.error("Response data:", err.response.data);
    }
  }
}

runTest();
