# The awesome Kaamelott Quotes GIF Portal

Backed on Solana using Anchor following the awesome guidance of [Builspace](https://buildspace.so/).

Requires a [Phantom Wallet](https://phantom.app) connected to the [Solana](https://docs.solana.com/) devnet funded with few SOL using Solana CLI faucet.

## Backend

* Written in Rust [Anchor](https://project-serum.github.io/anchor) eDSL
* [Deployed to the Solana devnet](https://explorer.solana.com/address/4H8RWS5zZsj34WitF4JEuVLUxmsQgYBA9XxWBQBT52Sz?cluster=devnet)
* Stores a list of GIF Urls and allow anyone who agrees to spend some SOL to:
  * add a GIF (of a Kaamelott Quote) to the list
  * vote for his.her preferred Kaamelott Quote

## Frontend

* Built using React
* Uses the anchor client side tooling and the Solana web3 connector.
* Deployed to surge.sh

You can give this app a try at http://foamy-laugh.surge.sh/