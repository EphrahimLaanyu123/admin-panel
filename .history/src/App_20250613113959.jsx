import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie'; // Import the js-cookie library

// Main App component
function App() {
  // State variable to hold user data (last visit time)
  const [lastVisit, setLastVisit] = useState('');
  const [showWarning, setShowWarning] = useState(false); // State for the data cleared warning message
  const [currentPage, setCurrentPage] = useState('home'); // State to control which page is shown ('home' or 'userData')

  // States for the new LLM feature
  const [userThought, setUserThought] = useState(''); // State for the user's input thought
  const [llmInsight, setLlmInsight] = useState(''); // State for the LLM's generated insight
  const [isLoadingLlm, setIsLoadingLlm] = useState(false); // State for loading indicator during LLM call

  // useEffect hook to load data from cookies when the component mounts
  useEffect(() => {
    // Attempt to retrieve the last visit time from cookies
    const storedLastVisit = Cookies.get('userLastVisit');

    // If a last visit time is found, set it in the state
    if (storedLastVisit) {
      setLastVisit(storedLastVisit);
    } else {
      // If no last visit is found, it means this is the first visit or cookie expired
      // Set the current time as the last visit and store it in a cookie
      const currentTime = new Date().toLocaleString();
      setLastVisit(currentTime);
      // Set the cookie to expire in 7 days, ensure it's secure and SameSite
      Cookies.set('userLastVisit', currentTime, { expires: 7, secure: true, sameSite: 'Lax' });
    }
  }, []); // The empty dependency array ensures this effect runs only once after initial render

  // Handler to clear all user-related cookies (only lastVisit in this version)
  const handleClearData = () => {
    // Remove the last visit cookie
    Cookies.remove('userLastVisit');

    // Reset the state variable
    setLastVisit('');
    // Clear any generated LLM insight when data is cleared
    setLlmInsight('');
    setUserThought('');

    // Show a confirmation message
    setShowWarning(true);
    const timer = setTimeout(() => {
      setShowWarning(false);
    }, 3000); // Hide message after 3 seconds
    return () => clearTimeout(timer); // Clean up the timer
  };

  // Handler for calling the Gemini API
  const getThoughtInsight = async () => {
    if (!userThought.trim()) {
      alert('Please enter a thought before getting an insight!');
      return;
    }

    setIsLoadingLlm(true); // Set loading state to true
    setLlmInsight(''); // Clear previous insight

    // Prepare the prompt for the LLM
    const prompt = `Given the user's thought "${userThought}", provide a concise, positive affirmation or a creative insight, maximum 50 words.`;

    // Construct the chat history for the API request
    let chatHistory = [];
    chatHistory.push({ role: "user", parts: [{ text: prompt }] });

    const payload = { contents: chatHistory };
    const apiKey = ""; // Canvas will automatically provide the API key at runtime

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Check if the response structure is as expected
      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        const text = result.candidates[0].content.parts[0].text;
        setLlmInsight(text); // Set the LLM's response
      } else {
        console.error('Unexpected API response structure:', result);
        setLlmInsight('Could not generate an insight. Please try again.');
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      setLlmInsight('Failed to connect to the insight generator. Try again!');
    } finally {
      setIsLoadingLlm(false); // Set loading state to false regardless of success or failure
    }
  };

  return (
    // Main container with Tailwind CSS for styling and responsiveness
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200 flex flex-col items-center justify-center p-4">
      {currentPage === 'home' && (
        <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md text-center">
          <h1 className="text-4xl font-extrabold text-gray-800 mb-4 tracking-tight">
            Welcome to the App!
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            This app demonstrates client-side cookie storage and LLM integration.
          </p>
          <button
            onClick={() => setCurrentPage('userData')}
            className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75"
          >
            View My Data & Get Insights
          </button>
        </div>
      )}

      {currentPage === 'userData' && (
        <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md text-center">
          <h1 className="text-4xl font-extrabold text-gray-800 mb-4 tracking-tight">
            Your User Data
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Your last visit was: <span className="font-semibold text-gray-700">{lastVisit || 'Never before (or cookie cleared)'}</span>
          </p>

          {/* Thought Input Section */}
          <div className="mt-8 mb-6 p-4 bg-gray-50 rounded-lg shadow-inner">
            <label htmlFor="user-thought" className="block text-gray-700 text-sm font-bold mb-2">
              Enter a thought or reflection:
            </label>
            <textarea
              id="user-thought"
              value={userThought}
              onChange={(e) => setUserThought(e.target.value)}
              placeholder="e.g., 'Feeling grateful today' or 'Thinking about new challenges'"
              rows="3"
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 ease-in-out resize-none"
            ></textarea>
            <button
              onClick={getThoughtInsight}
              disabled={isLoadingLlm} // Disable button while loading
              className="mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-5 rounded-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingLlm ? 'Generating...' : '✨ Get Thought Insight'}
            </button>
          </div>

          {/* LLM Insight Display */}
          {llmInsight && (
            <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-400 text-blue-800 rounded-lg text-left">
              <p className="font-bold mb-2">Insight from Gemini:</p>
              <p>{llmInsight}</p>
            </div>
          )}

          {/* Button to clear data */}
          <button
            onClick={handleClearData}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75 mt-8 mr-2"
          >
            Clear My Data
          </button>

          <button
            onClick={() => setCurrentPage('home')}
            className="mt-8 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75"
          >
            Go to Home
          </button>
        </div>
      )}

      {/* Important Security Warning */}
      <div className="mt-8 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-lg shadow-md w-full max-w-md">
        <p className="font-bold text-lg mb-2">Important Security Note:</p>
        <p className="text-sm">
          While convenient for small, non-sensitive data like preferences or last visit,
          **DO NOT** store sensitive information (e.g., passwords, personal IDs, financial data)
          directly in client-side cookies. Cookies are easily accessible and can be
          compromised. For sensitive user data, a secure backend authentication system
          is absolutely essential.
        </p>
      </div>

      {/* Footer / Info */}
      <div className="mt-8 text-gray-500 text-sm">
        <p>This app uses <code className="font-mono text-gray-600">js-cookie</code> for client-side cookie storage.</p>
        <p>Data persists across browser sessions based on cookie expiration settings.</p>
      </div>
    </div>
  );
}

export default App;
