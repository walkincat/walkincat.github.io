---
title: 解決 NFT 流動性問題？讓 NFTX 來告訴你！
date: 2021-08-16 18:00:00
cover: /img/2021-08-16-nftx/logo.png
tags:
    - NFT
    - NFTX
    - DAO
categories:
    - NFT
feature: false
---

在 NFT 火熱的市場中，其實有一件事情常常被投資人們所提及那就是 NFT 的流動性，因為 NFT 基本上為每個獨立的個體，所以他並不能像經濟市場的代幣或股票一樣廣為被人所交易，那當然也缺少了相對應的流動性，本文將會帶領各位讀者一同了解 NFTX 這個項目並且告訴帶大家看 NFTX 是如何解決流動性相關問題的！

## 介紹

<img src="/img/2021-08-16-nftx/logo.png">

據 NFTX 官網所述，NFTX 是一個 DAO（去中心化治理組織）所創建的項目，目的是希望為流動性差的 NFTs 創建流動性市場的平台。

用戶將他們的 NFT 存入 NFTX 保險庫（Vault），並鑄造一個同質化（Fungible）的 ERC20 代幣（vToken），代表對保險庫內隨機資產的要求。vToken 也可以用來從保險庫中贖回特定的 NFT。

優點：
- 可以抵押 LP 和鑄造的 vToken 來賺取收益獎勵
- 為 NFT 項目提供更好的分配和價格發現
- 通過將任何 NFT 鑄成 ERC20 並通過 SushiSwap 進行交換，即時出售 NFT
- 為 NFT 投資者增加流動性

---

## 運作原理

### 創建保險庫（Vault）

<img src="/img/2021-08-16-nftx/vault.jpg">

任何人都可以在以太坊上為任何 NFT 資產創建保險庫。一旦保險庫被創建，任何用戶都可以將符合條件的 NFT 存入保險庫，以鑄造一個同質化的 NFT 支持的代幣，稱為 "vToken"。

### 鑄造 vToken

任何人都可以將 NFT 存入現有的保險庫或他們創建的保險庫，以便鑄造一個可替代的 vToken，代表對保險庫內的隨機 NFT 來 1:1 索賠。

### 底價 (Floor Prices)

用戶可以在自動做市商（AMM）（如 SushiSwap）中匯入他們鑄造的 vToken，提供其他用戶一個可交易的流動市場。隨著流動性和交易量的建立，由 NFT 背書的 vToken 進入價格發現階段，最低價格就會出現。

底價是指某一特定 NFT 的最低價格。用戶通過在他們認為自己的 NFT 被高估的市場上鑄造和出售 vToken 來建立一個底價。

> NFTX 正在幫助建立可靠的 NFT 底價，使其在以太坊的去中心化金融中得到更廣泛的應用。

例如，一個用戶有 5 個 HashMasks，並高度重視其中的兩個。然而，他們認為其他 3 個 HashMasks 的價值低於 SushiSwap 上的 Mask Vault 的市場價格。用戶將這 3 個 HashMasks 存入 SushiSwap，並在 SushiSwap 上出售他們的 3 個 MASK 代幣，降低了它的價格，有助於價格發現。

> 上述過程將繼續進行，直到達到最低價格。

### 資格條件

Mask 保險庫允許存放任何 NFTs，但其他保險庫會使用資格限制，只允許存放特定的類別的 NFTs。例如，Kitty Gen 0 的保險庫有一個資格限制，只包括元數據為第 0 代的 Kitty，其他 Kitty 不能存入該金庫。

## 誰從 NFTX 中受益？

我們從以上歸集了三類人為此 NFTX 的受益者。

### 蒐集者

NFTs 在其基本形式下不賺取收益。然而，當它們被用來鑄造 vToken 時，它們可以進入去中心化的金融世界。簡單地說，收藏家可以使用 NFTX 從他們的 NFT 中釋放更多價值。

- 賺取協議費
- 作為流動性提供者賺取交易費
- 使用 vTokens 作為貸款抵押物提出穩定幣進行套利。

### 內容創造者

通過在 NFTX 協議上發布，內容創作者能夠永久地賺取協議費，同時還能提高分發的範圍和公平性。

- 賺取協議費
- 通過 AMM 以 vTokens 的形式分發 NFTs
- 為新內容創造即時的流動性市場

### 投資者

NFTs 通常流動性很差，難以定價。NFTX 使 NFT 市場的投機和投資成為一個更簡單的過程。

- 進入流動性最強的 NFTs 市場
- 追蹤特定類別的 NFT 的價格

---
## NFT LP 質押獎勵

- NFTX 質押：https://app.nftx.org/staking/

<img src="/img/2021-08-16-nftx/staking.png">

根據上述，流動性提供者可以在 NFTX 質押他們的 SLP（SushiSwap LP）代幣來獲得獎勵。

LP 質押者的獎勵如下：
- 0% 的隨機兌換費用（例如 1 PUNK = 1 隨機 CryptoPunk NFT）
- 5% 有針對性的兌換費用（例如 1.05 PUNK = 1 指定 CryptoPunk NFT）
- 0% 鑄造（Mint）費用

## 小結

目前的 NFT 熱度相當的高，過往我們購買藝術品或不同種類的 NFT 時，我們可能會覺得買來就只能一直放著，現在 NFTX 製作出新的模式，讓大家可以把 NFT 存入保險庫並鑄造一個 vToken。我們同時也可以拿這個 vToken 至 SushiSwap 和其他幣種配對存成 LP Token（SLP），此的 SLP 並非 Axie 的代幣而是 Sushi SWap LP Token。

未來的 NFT 玩法將會越來越多種，覺得這篇文章寫得好的話，請給我們點鼓勵！

- NFTX 合約地址：0x87d73e916d7057945c9bcd8cdd
- NFTX VAULT: https://app.nftx.org/

--- 
# WalkinCat
各位讀者們大家好，這裡是 WalkinCat 一個熱愛分享區塊鏈知識以及分享套利/保本投資經驗的社群，希望可以在未來的時間分享更多有趣的產品及使用心得。

- [加入 TG 大家族](https://t.me/walkincat)
- [加入 WalinCat 頻道](https://t.me/walkincat2020)
- [加入 Instagram 獲取第一手資訊](https://bit.ly/2TgZ6ou)
- [加入 Facebook 獲取第一手資訊](https://bit.ly/3xMmPMd)
- [更多相關連結](https://linktr.ee/walkincat)