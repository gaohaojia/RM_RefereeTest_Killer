// ==UserScript==
// @name         提取选择题并保存为CSV
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  提取网页中的选择题并将它们保存为CSV格式
// @author       你的名字
// @match        https://ks.wjx.top/*
// @grant        none
// ==/UserScript==
// ==UserScript==
// @name         题目提取脚本
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  提取选择题并保存为CSV文件
// @author       您的名字
// @match        需要运行脚本的网页URL
// @grant        none
// ==/UserScript==


(function() {
    'use strict';

    var questions = JSON.parse(localStorage.getItem("questions") || "[]");

    // 如果localStorage中没有数据，则从URL获取JSON文件
    if (questions.length === 0) {
        var jsonUrl = "https://raw.githubusercontent.com/ShiratsuYudachi/RM_RefereeTest_Killer/main/answers.json"; // 替换为您的JSON文件URL
        fetch(jsonUrl)
            .then(response => response.json())
            .then(data => {
                questions = data; // 将获取的JSON数据赋值给questions数组
                localStorage.setItem("questions", JSON.stringify(questions)); // 将数据存储到localStorage中
                addAnswerButtons(); // 添加按钮
            })
            .catch(error => {
                console.error("Error fetching JSON:", error);
            });
    } else {
        addAnswerButtons(); // 如果已经有questions数据，则直接添加按钮
    }


    function cosineSimilarity(str1, str2) {
        // 将字符串分割成单词数组
        const words1 = str1.toLowerCase().split(/\s+/);
        const words2 = str2.toLowerCase().split(/\s+/);
    
        // 创建词频向量
        const vector1 = {};
        const vector2 = {};
    
        // 填充词频向量
        words1.forEach(word => {
            vector1[word] = (vector1[word] || 0) + 1;
        });
    
        words2.forEach(word => {
            vector2[word] = (vector2[word] || 0) + 1;
        });
    
        // 计算点积
        let dotProduct = 0;
        for (const word in vector1) {
            if (vector2.hasOwnProperty(word)) {
                dotProduct += vector1[word] * vector2[word];
            }
        }
    
        // 计算模长
        const magnitude1 = Math.sqrt(Object.values(vector1).reduce((acc, val) => acc + val * val, 0));
        const magnitude2 = Math.sqrt(Object.values(vector2).reduce((acc, val) => acc + val * val, 0));
    
        // 计算余弦相似度
        const similarity = dotProduct / (magnitude1 * magnitude2);
    
        // 转换为百分比
        const percentageSimilarity = (similarity * 100).toFixed(2);
    
        return percentageSimilarity;
    }
    

    // 添加按钮到页面
    function addButton() {
        var buttonCollect = document.createElement("button");
        buttonCollect.innerHTML = "收集题目";
        buttonCollect.style.position = "absolute";
        buttonCollect.style.top = "20px";
        buttonCollect.style.right = "20px";
        buttonCollect.style.width = "200px";
        buttonCollect.style.height = "50px";
        buttonCollect.addEventListener("click", collectQuestions);
        document.body.appendChild(buttonCollect);

        var buttonDownload = document.createElement("button");
        buttonDownload.innerHTML = "下载题目 (" + questions.length + ")";
        buttonDownload.style.position = "absolute";
        buttonDownload.style.top = "80px";
        buttonDownload.style.right = "20px";
        buttonDownload.style.width = "200px";
        buttonDownload.style.height = "50px";
        buttonDownload.addEventListener("click", downloadJSON);
        document.body.appendChild(buttonDownload);


        var buttonClear = document.createElement("button");
        buttonClear.innerHTML = "清除数据";
        buttonClear.style.position = "absolute";
        buttonClear.style.top = "140px";
        buttonClear.style.right = "20px";
        buttonClear.style.width = "200px";
        buttonClear.style.height = "50px";
        buttonClear.addEventListener("click", clearQuestions);
        document.body.appendChild(buttonClear);

        // 添加导入按钮
        var buttonImport = document.createElement("button");
        buttonImport.innerHTML = "导入数据";
        buttonImport.style.position = "absolute";
        buttonImport.style.top = "200px";
        buttonImport.style.right = "20px";
        buttonImport.style.width = "200px";
        buttonImport.style.height = "50px";
        buttonImport.addEventListener("click", importQuestions);
        document.body.appendChild(buttonImport);
    }
    function clearQuestions() {
        questions = [];
        localStorage.removeItem("questions");
        updateDownloadButtonText();
    }

    function importQuestions() {
        var fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".json";
        fileInput.onchange = e => {
            var file = e.target.files[0];
            if (file) {
                var reader = new FileReader();
                reader.onload = function(event) {
                    try {
                        questions = JSON.parse(event.target.result);
                        localStorage.setItem("questions", JSON.stringify(questions));
                        updateDownloadButtonText();
                    } catch (error) {
                        alert("文件解析错误");
                    }
                };
                reader.readAsText(file);
            }
        };
        fileInput.click();
    }

    // 更新下载按钮文本
    function updateDownloadButtonText() {
        var buttonDownload = document.body.querySelector("button:nth-of-type(2)");
        buttonDownload.innerHTML = "下载题目 (" + questions.length + ")";
    }


    // 收集问题
    function collectQuestions() {
        var fields = document.querySelectorAll(".field.ui-field-contain");

        fields.forEach(function(field) {
            var questionParts = Array.from(field.querySelectorAll(".topichtml > div")).map(div => div.innerText.trim());
            var questionText = field.querySelector(".topichtml").childNodes[0].nodeValue.trim() + questionParts.join(" ");
            var options = Array.from(field.querySelectorAll(".label")).map(el => el.innerText.trim());

            var questionObj = {
                questionText: questionText,
                options: options,
                answer: "U" // 默认答案为"U"
            };

            // 检查问题是否已经存在于数组中
            if (!questions.some(q => q.questionText === questionText)) {
                questions.push(questionObj);
                // 更新localStorage中的数据
                localStorage.setItem("questions", JSON.stringify(questions));
            }
        });

        // 更新下载按钮文本
        var buttonDownload = document.body.querySelector("button:nth-of-type(2)");
        buttonDownload.innerHTML = "下载题目 (" + questions.length + ")";
    }

    // 生成并下载JSON
    function downloadJSON() {
        var jsonContent = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(questions, null, 4));
        var link = document.createElement("a");
        link.setAttribute("href", jsonContent);
        link.setAttribute("download", "questions.json");
        document.body.appendChild(link);
        link.click();
    }

    addButton();

    function chooseAnswer(questionElement, answer) {
        //alert("Going Return");;
        if (answer === 'U' || answer === 'N') return; // 如果答案为'U'，则不执行任何操作
    
        // 获取选项元素列表
        //alert("Passed Return");
        var radios = questionElement.querySelectorAll('.ui-radio');
        var answerIndex = answer.charCodeAt(0) - 'A'.charCodeAt(0); // 将答案字符转换为索引（A -> 0, B -> 1, ...）
        radios[answerIndex].click()
    }

// 添加选择答案的按钮
function addAnswerButtons() {
    var questionElements = document.querySelectorAll('.field.ui-field-contain');

    questionElements.forEach(function(questionElement) {
        var button = document.createElement('button');

        // 获取问题文本
        var questionText = Array.from(questionElement.querySelectorAll(".topichtml > div")).map(div => div.innerText.trim())

        // 在questions数组中查找问题
        var matchingQuestion = questions.find(function(q) {
            return cosineSimilarity(q.questionText, questionText) >= 0.8;
        });

        // 设置按钮文本和答案
        if (matchingQuestion) {
            button.innerHTML = '选择 ' + matchingQuestion.answer;
            chooseAnswer(questionElement, matchingQuestion.answer);
        } else {
            button.innerHTML = '未匹配到该问题';
        }

        button.style.marginLeft = '10px';
        questionElement.appendChild(button);
    });
    
}

addAnswerButtons();
})();