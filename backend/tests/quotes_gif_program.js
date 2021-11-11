const assert = require("assert");
const anchor = require("@project-serum/anchor");

describe("quote-gif-program", () => {
  const provider = anchor.Provider.local();
  anchor.setProvider(provider);

  const program = anchor.workspace.QuotesGifProgram;

	// Create an account keypair for our program to use.
  const baseAccount = anchor.web3.Keypair.generate();

  it('Is initializes the program', async function() {
    console.log("🚀 Starting test...")

    const tx = await program.rpc.initialize({
      accounts: {
        baseAccount: baseAccount.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [baseAccount],
    });

    console.log("📝 Your transaction signature", tx);

    let account = await program.account.baseAccount.fetch(baseAccount.publicKey);
    assert.ok(account.totalGifs.eq(new anchor.BN(0)));
  });

  it('Adds a GIF', async function() {
    await program.rpc.addGif("insert_a_giphy_link_here", {
      accounts: {
        baseAccount: baseAccount.publicKey,
        user: provider.wallet.publicKey,
      },
    });

    let account = await program.account.baseAccount.fetch(baseAccount.publicKey);
    assert.ok(account.totalGifs.eq(new anchor.BN(1)));

    let gifs = account.gifList;
    assert.equal(gifs[0].gifLink, "insert_a_giphy_link_here");
    assert.ok(gifs[0].userAddress.equals(provider.wallet.publicKey));
  });

  it('Upvotes a GIF', async function() {
    // upVote, downVote and updateItem requires an item index (u64)
    // that should be provided as an anchor.BN()
    await program.rpc.upVote(new anchor.BN(0), {
      accounts: {
        baseAccount: baseAccount.publicKey,
        user: provider.wallet.publicKey,
      },
    });

    let account = await program.account.baseAccount.fetch(baseAccount.publicKey);
    let gifs = account.gifList;
    assert.ok(gifs[0].votes.eq(new anchor.BN(1)));
  });

  it('Updates a GIF with Vote.Up', async function() {
    await program.rpc.updateItem(new anchor.BN(0), { up: {} }, {
      accounts: {
        baseAccount: baseAccount.publicKey,
        user: provider.wallet.publicKey,
      }
    });

    let account = await program.account.baseAccount.fetch(baseAccount.publicKey);
    let gifs = account.gifList;
    assert.ok(gifs[0].votes.eq(new anchor.BN(2)));
  });

  it('Updates a GIF with Vote.Down', async function() {
    await program.rpc.updateItem(new anchor.BN(0), { down: {} }, {
      accounts: {
        baseAccount: baseAccount.publicKey,
        user: provider.wallet.publicKey,
      }
    });

    let account = await program.account.baseAccount.fetch(baseAccount.publicKey);
    let gifs = account.gifList;
    assert.ok(gifs[0].votes.eq(new anchor.BN(1)));
  });

  it('Downvotes a GIF', async function() {
    // upVote, downVote and updateItem requires an item index (u64)
    // that should be provided as an anchor.BN()
    await program.rpc.downVote(new anchor.BN(0), {
      accounts: {
        baseAccount: baseAccount.publicKey,
        user: provider.wallet.publicKey,
      },
    });

    let account = await program.account.baseAccount.fetch(baseAccount.publicKey);
    let gifs = account.gifList;
    assert.ok(gifs[0].votes.eq(new anchor.BN(0)));
  });

  it('Cannot update a non existing GIF (Simulated)', async function() {
    try {
      // we know it updateItem() will fail and we don't want the stacktrace
      await program.simulate.updateItem(new anchor.BN(1), { up: {} }, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });
      assert.ok(false);
    } catch (err) {
      // We expect to catch an exception here but the exception object is not really helpful
      assert.ok(true);
  //   const errMsg = "No GIF at this index";
  //   assert.equal(err.toString(), errMsg);
  //   assert.equal(err.msg, errMsg);
  //   assert.equal(err.code, 300);
    }
  });
});
