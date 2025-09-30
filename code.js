console.log("插件初始化开始");

// 初始化插件
window.Asc.plugin.init = function() {
    console.log("插件已初始化1");
};

// 上下文菜单显示事件
Asc.plugin.attachEvent("onContextMenuShow", (options) => {
    console.log("上下文菜单显示事件触发");

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
            console.log("无内容")
            window.Asc.plugin.executeMethod("GetDocumentLang", [], function(lang) {
                console.log(lang)
                if (lang == "zh-CN") {
                    showToast("请先选择文本", "#FFAA00", 3000)
                } else {
                    showToast("Please select some text first", "#FFAA00", 3000)
                }
            });
            return;
        }


        let result;
        if (id == "convertChineseToFan") {
            result = convertSimplifiedToTraditional(selectedText);
        } else if (id == "convertFanToChinese") {
            result = convertTraditionalToSimplified(selectedText);
        } else if (id == "addPinyin") {
            result = addPinyinAnnotations(selectedText);
        } else if (id == "removePinyin") {
            result = removePinyinAnnotations(selectedText);
        }
        // console.log(result)
        // 替换选中的文本
        // window.Asc.plugin.executeMethod("PasteHtml", [result]);
        window.Asc.plugin.executeMethod("PasteText", [result]);

    });
};

function action(id) {
    // 先获取当前选中的文本
    window.Asc.plugin.executeMethod("GetSelectedText", [], function(selectedText) {
        if (!selectedText || selectedText.trim() === "") {

            window.Asc.plugin.executeMethod("GetDocumentLang", [], function(lang) {
                console.log(lang)
                if (lang == "zh-CN") {
                    showToast("请先选择文本", "#FFAA00", 3000)
                } else {
                    showToast("Please select some text first", "#FFAA00", 3000)
                }
            });
            return;
        }

        console.log(selectedText)

        let result;
        if (id == "convertChineseToFan") {
            result = convertSimplifiedToTraditional(selectedText);
        } else if (id == "convertFanToChinese") {
            result = convertTraditionalToSimplified(selectedText);
        } else if (id == "addPinyin") {
            result = addPinyinAnnotations(selectedText);
        } else if (id == "removePinyin") {
            result = removePinyinAnnotations(selectedText);
        }
        // console.log(result)
        // 替换选中的文本
        // window.Asc.plugin.executeMethod("PasteHtml", [result]);
        window.Asc.plugin.executeMethod("PasteText", [result]);
        window.Asc.plugin.executeMethod("GetDocumentLang", [], function(lang) {
            console.log(lang)
            if (lang == "zh-CN") {
                showToast("操作成功！")
            } else {
                showToast("Success!")
            }
        });
    });
}
// 简体转繁体函数
function convertSimplifiedToTraditional(text) {
    console.log(111)
    const converter = OpenCC.Converter({ from: 'cn', to: 'tw' });
    return converter(text);
}

// 繁体转简体函数
function convertTraditionalToSimplified(text) {
    const converter = OpenCC.Converter({ from: 'tw', to: 'cn' });
    return converter(text);
}

// function addPinyinAnnotations(text) {
//     let result = '';
//     for (const char of text) {
//         if (/[\u4e00-\u9fa5]/.test(char)) {
//             const pinyin = pinyinPro.pinyin(char, { toneType: 'symbol', multiple: false });
//             result += `<ruby>${char}<rt>${pinyin}</rt></ruby>`;
//         } else {
//             result += char;
//         }
//     }
//     return result;
// }
// function addPinyinAnnotations(text) {
//     let result = '';
//     for (const char of text) {
//         if (/[\u4e00-\u9fa5]/.test(char)) {
//             const pinyin = pinyinPro.pinyin(char, { toneType: 'symbol', multiple: false });
//             result += `<span style="display:table; text-align:center; line-height:1;">
//                         <span style="display:table-row; font-size:0.6em;">${pinyin}</span>
//                         <span style="display:table-row;">${char}</span>
//                        </span>`;
//         } else {
//             result += char;
//         }
//     }
//     return result;
// }

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
    document.getElementById("button4").innerHTML = window.Asc.plugin.tr("removePinyin");
    document.getElementById("operatorHints2").innerHTML = window.Asc.plugin.tr("Tip: Right-click after selecting text to use the function directly.");
}