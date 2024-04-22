// ==UserScript==
// @name         Latest script image v1
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Adds a button to copy all text from a specified div and send it to an assistant API
// @author       You
// @match        https://tinder.com/app/recs
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

     const selectedData = {}; // Object to store data

    // Fetch and send image URL to OpenAI
    function sendImageToOpenAI(imageUrl) {
        GM_xmlhttpRequest({
            method: "POST",
            url: "https://api.openai.com/v1/chat/completions",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer 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"
            },
            data: JSON.stringify({
                model: "gpt-4-turbo",
                messages: [
                    {
                        "role": "system",
                        "content": "Respond with only one word - yes or no based on the user's query"
                    },
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": "Analyse the image for the following user preferences: \"" + JSON.stringify(selectedData) + "\". Respond yes if all are true and respond no if any are untrue."},
                            {"type": "image_url", "image_url": {"url": imageUrl}}
                        ]
                    }
                ]
            }),
            onload: handleApiResponse,
            onerror: function(err) {
                console.error('API Error:', err);
            }
        });
    }

    function fetchBackgroundImage() {


        const imageDivs = document.querySelectorAll('div[role="img"].Bdrs\\(8px\\).Bgz\\(cv\\).Bgp\\(c\\).StretchedBox');
        if (imageDivs.length > 0) {
            const div = imageDivs[1]; // Assuming you want the first image found
            const backgroundImageStyle = div.style.backgroundImage;
            const imageUrlMatch = backgroundImageStyle.match(/url\("(.+?)"\)/);
            if (imageUrlMatch && imageUrlMatch[1]) {
                sendImageToOpenAI(imageUrlMatch[1]);
                console.log('Image URL:', imageUrlMatch[1]);
            }
        } else {
            console.log('No matching image divs found.');
        }
    }


    // UI stuff

    const mainContainer = document.createElement('div');
    mainContainer.id = 'tm-main-container';
    mainContainer.style.position = 'fixed';
    mainContainer.style.top = '0';
    mainContainer.style.right = '0';
    mainContainer.style.width = '25%';
    mainContainer.style.maxHeight = '95vh';
    mainContainer.style.overflowY = 'auto';
    mainContainer.style.zIndex = '10000';
    mainContainer.style.backgroundColor = '#000';
    document.body.appendChild(mainContainer);

    const handleButtonClick = (button, category, header) => {
        button.classList.toggle('selected');
        const selectedButtons = [...mainContainer.querySelectorAll(`.${category} .selected`)];
        const selectedTexts = selectedButtons.map(btn => btn.textContent);

        // Check if the button is selected or not to update the list correctly
        if (button.classList.contains('selected')) {
            // If the button is now selected, add its text if not already added
            if (!selectedData[category]) {
                selectedData[category] = { header: header, selectedTexts: [] };
            }
            if (!selectedData[category].selectedTexts.includes(button.textContent)) {
                selectedData[category].selectedTexts.push(button.textContent);
            }
        } else {
            // If the button is deselected, remove its text from the list
            const index = selectedData[category].selectedTexts.indexOf(button.textContent);
            if (index > -1) {
                selectedData[category].selectedTexts.splice(index, 1);
            }
        }

        console.log(selectedData);
    };

    // Style injection for the buttons and the container
    const css = `

        #tm-main-container {
            position: fixed; // The main container is fixed to the top right
            top: 0;
            right: 0;
            width: 20%; // Adjust as needed, up to 50% if needed more space
            max-height: 95vh;
            overflow-y: auto;
            z-index: 10000;
            background-color: #000;
        }
        .question-container {
            position: relative; // Each question container will be relative inside the main container
            background-color: #000;
            color: white;
            padding: 8px;
            border-radius: 8px;
            box-sizing: border-box;
            font-family: Arial, sans-serif;
            margin-bottom: 0px; // Spacing between question containers
        }
        .question-header {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 4px;
        }
        .button-container {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
        }
        .tm-button {
            padding: 5px 10px;
            margin: 2px;
            border: 1px solid #ccc;
            border-radius: 15px;
            background-color: #222;
            cursor: pointer;
            font-size: 12px;
            color: white;
            outline: none;
            transition: background-color 0.3s, color 0.3s, border-color 0.3s;
        }
        .tm-button.selected {
            color: #fff;
            background-color: #555;
            border-color: #555;
        }
        .tm-button:not(.selected):hover {
            border-color: #888;
        }
    `;

    // Append the styles to the document
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = css;
    document.head.appendChild(styleSheet);

    // Define the button groups and their labels
    const buttonGroups = {
        "o1": {
            "header": "Only swipe profiles with a face in the first image?",
            "buttons": ["Yes", "No"]
        },
        "o2": {
            "header": "Fitness preferences in your partner?",
            "buttons": ["Very Fit", "Medium-fit", "YOLO"]
        },
        "o3": {
            "header": "Personality preference (based on posture and facial expression)?",
            "buttons": ["Confident and Approachable", "Reserved and Thoughtful", "Energetic and Enthusiastic","Calm and Relaxed","Serious and Professional"]
        },
        "o4": {
            "header": "Swipe profiles with bad image quality?",
            "buttons": ["Yes", "No"]
        },
    };

    // Iterate over each group and create the elements
    Object.entries(buttonGroups).forEach(([category, groupInfo]) => {
        const container = document.createElement('div');
        container.classList.add('question-container');

        const header = document.createElement('div');
        header.classList.add('question-header');
        header.textContent = groupInfo.header;
        container.appendChild(header);

        const buttonContainer = document.createElement('div');
        buttonContainer.classList.add('button-container');

        groupInfo.buttons.forEach(label => {
            const button = document.createElement('button');
            button.classList.add('tm-button');
            button.textContent = label;
            // Ensure the button click handler is set up correctly
            button.addEventListener('click', () => handleButtonClick(button, category, groupInfo.header));
            buttonContainer.appendChild(button);
        });

        container.appendChild(buttonContainer);
        mainContainer.appendChild(container);
    });

    //UI stuff end

    // Function to handle the API response
    function handleApiResponse(apiResponse) {
        const response = JSON.parse(apiResponse.responseText); // Parsing the response text to JSON
        const assistantResponse = response.choices[0].message.content.trim().toLowerCase();
        console.log("Assistant's Response:", assistantResponse);

        // Function to click the button based on inner text search
        function clickButtonByText(buttonText) {
            const buttons = document.querySelectorAll('button');
            for (let button of buttons) {
                if (button.innerText.toLowerCase().includes(buttonText.toLowerCase())) {
                    button.click();
                    console.log('Clicked Button:', buttonText);
                    return;
                }
            }
            console.log('Button not found:', buttonText);
        }

        if (assistantResponse === 'yes') {
            // Enhanced approach: Click the second "Like" button
            const buttons = Array.from(document.querySelectorAll('button')); // Convert NodeList to Array
            const likeButtons = buttons.filter(button => button.innerText.toLowerCase().includes('like')); // Filter for 'like'

            if (likeButtons.length >= 2) {
                likeButtons[1].click(); // Click the second 'like' button
                console.log('Clicked the second Like button.');
            } else {
                console.log('Not enough Like buttons found.');
            }
        } else if (assistantResponse === 'no') {
            // Click the "no" button, identified by "Nope"
            clickButtonByText('Nope');
        } else {
            console.log('Unexpected response:', assistantResponse);
        }
    }

    // Function to extract and send text from the target element
    function copyAndSendTextFromDiv() {
        function clickButtonByText2(buttonText) {
            const buttons = document.querySelectorAll('button');
            for (let button of buttons) {
                if (button.innerText.toLowerCase().includes(buttonText.toLowerCase())) {
                    button.click();
                    console.log('Clicked Button:', buttonText);
                    return;
                }
            }
            console.log('Button not found:', buttonText);
        }

 



        setTimeout(() => {
        }, 1000);
    }


    function addButton2() {
        const button = document.createElement('button');
        button.textContent = 'Swipe for me';
        button.style.position = 'fixed';
        button.style.top = '10px';
        button.style.left = '10px';
        button.style.zIndex = '10000';
        button.style.padding = '12px 24px';
        button.style.fontSize = '18px';
        button.style.border = 'none';
        button.style.borderRadius = '5px';
        button.style.backgroundColor = '#4CAF50';
        button.style.color = 'white';
        button.style.cursor = 'pointer';
        button.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        button.style.transition = 'background-color 0.3s, box-shadow 0.3s';

        // Hover effects
        button.onmouseover = function() {
            this.style.backgroundColor = '#45a049';
            this.style.boxShadow = '0 8px 16px rgba(0,0,0,0.2)';
        };

        // Revert hover effects
        button.onmouseout = function() {
            this.style.backgroundColor = '#4CAF50';
            this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        };

        // Initial click listener
        button.addEventListener('click', function() {
        copyAndSendTextFromDiv(); // Call your main function on the first click

        // Setup repeated clicks
        let count = 0;
        const maxClicks = 2;
        const intervalId = setInterval(() => {
            if (count < maxClicks) {
                copyAndSendTextFromDiv(); // Perform the action
                console.log('Automated click #' + (count + 1));
                count++;
            } else {
                clearInterval(intervalId); // Stop the interval after 5 repeats
                console.log('Completed automated clicks.');
            }
        }, 4000); // Repeat every 2 seconds
    });

    document.body.appendChild(button);
}

window.addEventListener('load', addButton2);
})();


