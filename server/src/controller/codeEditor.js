async function runCode() {
  const sourceCode = "print('Hello World')";
  const languageId = 71; // Python 3

  // Submit code
  let response = await fetch("https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-RapidAPI-Key": "6d70cfac59mshb7bc68bb44d9938p144538jsn3b55fc98e371", 
      "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com"
    },
    body: JSON.stringify({
      source_code: sourceCode,
      language_id: languageId
    })
  });

  let result = await response.json();
  console.log("Output:", result.stdout);
}

runCode();