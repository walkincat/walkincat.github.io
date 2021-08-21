---
title: 科普知識 | Solana 上的可能性與未來
date: 2021-07-20 10:00:00
cover: /img/2021-07-20-solana-future/solana.png
tags:
    - Solana
    - 科普
    - 合作分享
categories:
    - Solana
# feature: true
---

> 此篇文章由 [Aaron Yan](https://t.me/AaronYan) 投稿。

# 關於 solana 的背景

Solana 是一條去中心化的區塊鏈，由 Anatoly Yakovenko 於 2017 年由以太坊（Ethereum）中的智能合約（Smart contract）獲得靈感而決定開發的項目，並與高通（Qualcomm）合作使用其通訊技術開發出用以解決以太坊（Ethereum）與比特幣（Bitcoin）上交易速度慢、手續費高昂，過於耗能的問題， 與 Bitcoin 和 Ethereum 不同的是，Solana 並非使用顯示卡或 ASIC 做為挖礦出塊的模式，而是使用 POH（poof of history）類似節點（Node）與驗證者（Validators）管理的出塊機制而後面會再提到。

因 Solana 是借鑑 Ethereum 所開發出來的區塊鏈，因此有與多雷同之處，Solana 作為一個非許可制的區塊鏈，同樣可以撰寫智能合約，智能合約意味著可以在鏈上開發 Dapp 去中心化程式，由 Solana 區塊鏈來託管，使用者可以與之互動、簽訂契約、執行程式、發行代幣等。

而 Solana 使用的原生代幣為 $SOL 做為在 Solana 上交易的媒介，如同 $ETH 一般，每次交易則會扣除一小部分的 $SOL 做為手續費，而這也是最重要的運作方式之一，$SOL 總產量 4.88 億 ，而目前流通量為 2.7億，透過抵押給驗證者（Validators）的方式來獲得利潤，而若是普通用戶則可以考慮至 [FTX](https://ftx.com/#a=2023804) 或是 [Binance](https://www.binance.com/) 上進行質押，年化收益約有 8% 左右。

--- 
# Solana 基礎知識
## 什麼是 POH(Proof of history)演算法
若是要比較現今較高使用率的兩大演算法 POW(proof of work) 與 POS(proof of stake)，那 Solana 使用的 POH 會比較接近於 POS(proof of stake) ，Solana 挖礦機制做為其出塊的模式，依據鏈上的時間戳記產生的雜湊函數做為防止區塊鏈同步運行並保持鏈上一貫性的主要機制，稱為 VDF(Verifiable Delay Function) 或稱為延遲驗證函數，與 Ethereum 的分散式時鐘不同，不需額外花時間進行同步，因此可以維持高 TPS。

![](https://i.imgur.com/rTopYLo.jpg)
而根據 [solanabeach.io](https://solanabeach.io/) 提供的觀測資訊目前有 745 個驗證者（Validators）與 423 節點（Node）在鏈上部屬並持續運作，雖然不及 Ethereum 的四千個節點，但也是一個驚人的數字。

## TPS 每秒交易次數
Solana 使用 POH 做為演算法因此有比其他大多數區塊鏈更快的交易速度，至目前截稿時間，根據 Solana Beach 提供的觀測資訊，Solana 的每秒交易次數為 1150-1721 左右，是 Ethereum 的 120 倍左右，而延遲速度只有接近於 0.4 秒，未來將可能因節點增加而有大幅度擴張。

![](https://i.imgur.com/ikZeovo.jpg)
圖片資訊由 [solanabeach.io](https://solanabeach.io/) 取得

## 特色
由上述資訊可以得知 Solana 最大的優勢便是 TPS，理論上可擁有每秒五萬的交易量是非常驚人的，可以達到許多區塊鏈無法執行的內容，如去中心化掛單簿功能就是，因為與 Ethereum 相比，Solana 的每秒交易速度夠快，足以做到短時間內掛單媒合及同時執行鏈上程式，有如在交易所執行買賣一般，有極低的延遲率，因此可以執行去中心化的掛單簿，而不會承受過高的滑價問題，是以太坊（Ethereum）所無法做到的。

而 Solana 也有較為困難的開發門檻並有更高的穩定性，這也造就了生態圈因較高的門檻導致進入開發的團隊水平較為優良，不容易產生品質低劣的產品。

## 安全性
相對於 Polygon 與 BSC 有較為中心化的節點，可以由節點本身任意回滾（Roll back）與調整更新（Update）亦或是調整手續費（Gas），然而 Solana 則需要節點同步並一致同意更新後才可以進行更動，相較於前兩者是較為去中心化的。

## 發展狀況以及項目

Solana 作為一個去年才啟動的項目，目前生態圈還不如 BSC、ETH 或是 EOS 甚至是Tron 齊全，相對而言 DeFi 用戶基數較少，但以 2021 年來說，近期各種 DeFi 項目也開始慢慢延伸到 Solana 鏈上了。

Serum DEX 計畫是由 FTX 贊助而產生的，內容包含去中心化交易所 DEX(Decentralize Exchange)，有如同 Uniswap 而且更加進化的功能，也有 Raydium 這個平台提供 SWAP 以及 Farming 和Fusion pool，還有 ORCA 這個自主提供流動性賺取手續費的平台。

雖然還有很多可以加強的地方，但是目前鏈上的內容也是日漸豐富。

---
# 項目介紹

> 以下將會介紹幾個 Solana 上的項目。

### [Serum](https://swap.projectserum.com/)
- 原生代幣: $SRM

由 FTX 贊助的自動做市商（AMM）平台，提供了如 Uniswap 的功能，可以上許多交易對提供用戶匯兌，而投資者也可以提供流動性，自成一個市場。

![](https://i.imgur.com/9tlidXe.jpg)

### [Raydium](https://raydium.io/)
- 原生代幣: $RAY

目前 Solana 上最主要的生態性都與 Rayduim 有連結，可以提供流動性和進行 Swap 交換，也有掛單版本的 Orderboard，也有 Ray 本身的 Farming 和目前 Solana 上最受歡迎的項目 Fusion pool，讓其他團隊可以提供流動性農場如 $Step、$Cope、$Rope、$Media 等給 Raydium 的用戶，並在用戶提供流動性質押服務，以獲得更多類型代幣。

![](https://i.imgur.com/BpMUOy7.png)

### [Sonar](https://sonar.watch/dashboard)
- 原生代幣: 尚無

Solana 主要的兩個儀表板（Dashboard），用以監控用戶資產狀態與流動性獎勵，也可以觀測錢包的使用狀態，與 [Step.finince](https://step.finance/) 並列為 Solana 兩大資產管理網站。

![](https://i.imgur.com/SiGAYw9.jpg)

---

# 起手式
看了這麼多 Solana 的資訊是不是有點不知道從哪邊開始呢?
筆者建議先從自己熟悉的交易所買一些 $SOL，進到 Raydium 後開始玩它的各種功能，嘗試看看 Swap 換一些不同種類的代幣，或是嘗試在掛單簿（Orderbook）掛單，或是為各大神奇代幣提供流動性，將會是一個好的開始。

### 近期開發項目列表
而蓬勃發展的 Solana 當然不會只有上面幾個，目前有更多團隊持續在 Solana 上開發，可以好好期待這個生態圈的發展。

![](https://i.imgur.com/hl4i6it.jpg)
新興團隊項目，圖片轉自S◎lanians

--- 
# 筆者介紹

> Aaron 現為 CypherPunks Taiwan 的成員，現 23 歲的他，也曾在台中的校園及多處演講區塊鏈技術相關議題，曾開發過多款以太坊上的 NFT 及 Dapp 應用，希望可以將區塊鏈應用及技術拓展讓更多人了解。

- 聯絡：[Aaron](https://t.me/AaronYan)
- CypherPunks Taiwan Member
- 區塊鏈疑難雜症顧問
- Mail : aaronru19@gmail.com

--- 
# WalkinCat
各位讀者們大家好，這裡是 WalkinCat 一個熱愛分享區塊鏈知識以及分享套利/保本投資經驗的社群，希望可以在未來的時間分享更多有趣的產品及使用心得。

- [加入 TG 大家族](https://t.me/walkincat)
- [加入 WalinCat 頻道](https://t.me/walkincat2020)
- [加入 Instagram 獲取第一手資訊](https://bit.ly/2TgZ6ou)
- [加入 Facebook 獲取第一手資訊](https://bit.ly/3xMmPMd)
- [更多相關連結](https://linktr.ee/walkincat)