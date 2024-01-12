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
        if (answer === 'U') return; // 如果答案为'U'，则不执行任何操作
    
        // 获取选项元素列表
        var options = questionElement.querySelectorAll('.ui-radio');
        var answerIndex = answer.charCodeAt(0) - 'A'.charCodeAt(0); // 将答案字符转换为索引（A -> 0, B -> 1, ...）
    
        // 点击对应的选项
        if (answerIndex >= 0 && answerIndex < options.length) {
            options[answerIndex].querySelector('.jqradio').click();
        }
    }

// 添加选择答案的按钮
function addAnswerButtons() {
    var questionElements = document.querySelectorAll('.field.ui-field-contain');

    questionElements.forEach(function(questionElement) {
        var button = document.createElement('button');

        // 获取问题文本
        var questionText = questionElement.querySelector('.topichtml').textContent.trim();

        // 在questions数组中查找问题
        var matchingQuestion = questions.find(function(q) {
            return q.questionText === questionText;
        });

        // 设置按钮文本和答案
        if (matchingQuestion) {
            button.innerHTML = '选择 ' + matchingQuestion.answer;
            button.addEventListener('click', function() {
                chooseAnswer(questionElement, matchingQuestion.answer);
            });
        } else {
            button.innerHTML = '选择 N';
            button.addEventListener('click', function() {
                chooseAnswer(questionElement, 'N');
            });
        }

        button.style.marginLeft = '10px';
        questionElement.appendChild(button);
    });
}

addAnswerButtons();
})();