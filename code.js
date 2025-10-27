// console.log("插件初始化开始");

// 初始化插件
window.Asc.plugin.init = function() {
    // console.log("插件已初始化1");
};

// 上下文菜单显示事件
Asc.plugin.attachEvent("onContextMenuShow", (options) => {
    // console.log("上下文菜单显示事件触发");

    const items = {
        guid: window.Asc.plugin.guid,
        items: [{
            id: "onClickItem1",
            text: { zh: "繁简转换器", en: "convert" },
            items: [{
                    id: "convertChineseToFan",
                    text: { zh: "简体字转繁体字", en: "Convert Select to Traditional" },
                },
                {
                    id: "convertFanToChinese",
                    text: { zh: "繁体字转简体字", en: "Convert Select to Simplified" },
                },
                {
                    id: "addPinyin",
                    text: { zh: "添加拼音", en: "Add pinyin" },
                },
                {
                    id: "removePinyin",
                    text: { zh: "移除拼音", en: "Remove pinyin" },
                },
            ],
        }]

    };
    window.Asc.plugin.executeMethod("UpdateContextMenuItem", [items]);


});


window.Asc.plugin.event_onContextMenuClick = (id) => {
    // 先获取当前选中的文本
    window.Asc.plugin.executeMethod("GetSelectedText", [], function(selectedText) {
        if (!selectedText || selectedText.trim() === "") {
            // console.log("无内容")
            window.Asc.plugin.executeMethod("GetDocumentLang", [], function(lang) {
                // console.log(lang)
                if (lang == "zh-CN") {
                    showToast("请先选择文本", "#FFAA00", 3000)
                } else {
                    showToast("Please select some text first", "#FFAA00", 3000)
                }
            });
            return;
        }

        core(id, selectedText)
    });
};

function action(id) {
    // 先获取当前选中的文本
    window.Asc.plugin.executeMethod("GetSelectedText", [], function(selectedText) {
        console.log(selectedText)
        if (!selectedText || selectedText.trim() === "") {

            window.Asc.plugin.executeMethod("GetDocumentLang", [], function(lang) {
                // console.log(lang)
                if (lang == "zh-CN") {
                    showToast("请先选择文本", "#FFAA00", 3000)
                } else {
                    showToast("Please select some text first", "#FFAA00", 3000)
                }
            });
            return;
        }

        // console.log(selectedText)
        core(id, selectedText)


    });
}

function core(id, selectedText) {
    let result;
    Asc.scope.inWord = false
    if (id == "convertChineseToFan") {
        const converter = OpenCC.Converter({ from: 'cn', to: 'tw' });

        const oldChars = selectedText.match(/[\u4E00-\u9FFF]/g);
        const finish = new Set()

        for (const ch of oldChars) {
            if (!finish.has(ch)) {
                let newChar = converter(ch)
                window.Asc.plugin.executeMethod("SearchAndReplace", [{
                    "searchString": ch,
                    "replaceString": newChar,
                }]);
                finish.add(ch);
            }
        }

        Asc.scope.newText = converter(selectedText)
        window.Asc.plugin.callCommand(function() {
            const ext = Api.GetFullName().split('.').pop().toLowerCase();
            const wordExtensions = [
                "docx", "doc", "odt", "ott", "rtf", "docm", "dot", "dotx", "dotm",
                "fb2", "fodt", "wps", "wpt", "xml", "pdf", "djv", "djvu",
                "docxf", "oform", "sxw", "stw", "xps", "oxps"
            ];
            if (!wordExtensions.includes(ext)) {
                Api.ReplaceTextSmart([
                    Asc.scope.newText
                ]);
            }
        }, false, true);
    } else if (id == "convertFanToChinese") {
        const converter = OpenCC.Converter({ from: 'tw', to: 'cn' });
        const oldChars = selectedText.match(/[\u4E00-\u9FFF]/g);
        const finish = new Set()
        for (const ch of oldChars) {
            if (!finish.has(ch)) {
                let newChar = converter(ch)
                window.Asc.plugin.executeMethod("SearchAndReplace", [{
                    "searchString": ch,
                    "replaceString": newChar,
                }]);
                finish.add(ch);
            }
        }

        Asc.scope.newText = converter(selectedText)
        window.Asc.plugin.callCommand(function() {
            const ext = Api.GetFullName().split('.').pop().toLowerCase();
            // 文本文档支持的后缀列表
            const wordExtensions = [
                "docx", "doc", "odt", "ott", "rtf", "docm", "dot", "dotx", "dotm",
                "fb2", "fodt", "wps", "wpt", "xml", "pdf", "djv", "djvu",
                "docxf", "oform", "sxw", "stw", "xps", "oxps"
            ];
            if (!wordExtensions.includes(ext)) {
                Api.ReplaceTextSmart([
                    Asc.scope.newText
                ]);
            }
        }, false, true);
    } else if (id == "addPinyin") {
        result = addPinyinAnnotations(selectedText);
        Asc.scope.newText = result;
        window.Asc.plugin.callCommand(function() {
            Api.ReplaceTextSmart([
                Asc.scope.newText
            ]);
        }, false, true);
    } else if (id == "removePinyin") {
        result = removePinyinAnnotations(selectedText);
        Asc.scope.newText = result;
        window.Asc.plugin.callCommand(function() {
            Api.ReplaceTextSmart([
                Asc.scope.newText
            ]);
        }, false, true);
    }

    window.Asc.plugin.executeMethod("GetDocumentLang", [], function(lang) {
        console.log(lang)
        if (lang == "zh-CN") {
            showToast("操作成功！")
        } else {
            showToast("Success!")
        }
    });
}

function addPinyinAnnotations(text) {
    // 1. 使用 pinyin-pro 一次性获取整段文字的拼音数组
    const pinyins = pinyinPro.pinyin(text, {
        toneType: 'symbol', // 带音调符号
        multiple: false, // 只取一个读音（库会根据上下文判断）
        type: 'array' // 返回数组形式，和原文字一一对应
    });

    let result = '';
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (/[\u4e00-\u9fa5]/.test(char)) {
            const py = pinyins[i]; // 直接取对应的拼音
            result += `${char}(${py})`;
        } else {
            result += char;
        }
    }

    return result;
}

function removePinyinAnnotations(text) {
    return text.replace(/([\u4e00-\u9fa5])\([^)]*\)/g, '$1');
}

function showToast(message, backgroundColor = "#4BB543", duration = 1000) {
    const toast = document.getElementById('toast');
    toast.style.backgroundColor = backgroundColor
    toast.textContent = message; // 更新文字
    toast.classList.add('show'); // 显示

    // 1 秒后自动隐藏
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}
window.Asc.plugin.onTranslate = function() {
    document.getElementById("operatorHints").innerHTML = window.Asc.plugin.tr("Please select the text you want to operate and click the corresponding operation button.");
    document.getElementById("button1").innerHTML = window.Asc.plugin.tr("Simplified → Traditional");
    document.getElementById("button2").innerHTML = window.Asc.plugin.tr("Traditional → Simplified");
    document.getElementById("button3").innerHTML = window.Asc.plugin.tr("Add pinyin");
    document.getElementById("button4").innerHTML = window.Asc.plugin.tr("Remove pinyin");
    document.getElementById("operatorHints2").innerHTML = window.Asc.plugin.tr("Tip: Right-click after selecting text to use the function directly.");
}