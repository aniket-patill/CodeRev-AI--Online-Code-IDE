const axios = require('axios');

async function test() {
    try {
        console.log("Testing Java execution...");
        const response = await axios.post("https://emkc.org/api/v2/piston/execute", {
            language: "java",
            version: "*",
            files: [
                {
                    name: "Solution.java",
                    content: "public class Solution { public static void main(String[] args) { System.out.println(\"Hello\"); } }"
                }
            ],
            stdin: "",
            run_timeout: 5000,
            compile_timeout: 10000
        });
        console.log("Success:", response.data);
    } catch (error) {
        console.error("Error Status:", error.response ? error.response.status : "No Response");
        console.error("Error Data:", error.response ? error.response.data : error.message);
    }
}

test();
