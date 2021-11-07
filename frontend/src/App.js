import { useEffect, useState } from 'react';
import twitterLogo from './assets/twitter-logo.svg';
import './App.css';
import { Connection, PublicKey, clusterApiUrl} from '@solana/web3.js';
import {
  Program, Provider, BN, web3
} from '@project-serum/anchor';

import idl from "./idl.json";
import kp from './keypair.json'

// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const MY_TWITTER_HANDLE = 'zedalaye';
const MY_TWITTER_LINK = `https://twitter.com/${MY_TWITTER_HANDLE}`;

// SystemProgram is a reference to the Solana runtime!
const { SystemProgram, Keypair } = web3;

// Load the keypair for the account that will hold the GIF data.
const arr = Object.values(kp._keypair.secretKey);
const secret = new Uint8Array(arr);
const baseAccount = Keypair.fromSecretKey(secret);

// Get our program's id form the IDL file.
const programID = new PublicKey(idl.metadata.address);

// Set our network to devent.
const cluster = 'devnet';
const network = clusterApiUrl(cluster);

// Control's how we want to acknowledge when a transaction is "done".
const opts = {
  preflightCommitment: "processed"
}

const App = () => {

  // State
  const [walletAddress, setWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [gifList, setGifList] = useState([]);

  /*
   * This function holds the logic for deciding if a Phantom Wallet is
   * connected or not
   */
  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;

      if (solana && solana.isPhantom) {
        console.log('Phantom wallet found!');

        const response = await solana.connect({ onlyIfTrusted: true });
        console.log('Connected with Public Key:', response.publicKey.toString());
        setWalletAddress(response.publicKey.toString());

      } else {
        alert('Solana object not found! Get a Phantom Wallet 👻');
      }
    } catch (error) {
      console.error(error);
    }
  };

  /*
   * Let's define this method so our code doesn't break.
   * We will write the logic for this next!
   */
  const connectWallet = async () => {
    const { solana } = window;

    if (solana && solana.isPhantom) {
      const response = await solana.connect();
      console.log('Connected with Public Key:', response.publicKey.toString());
      setWalletAddress(response.publicKey.toString());
    }
  };

  const onInputChange = (event) => {
    const { value } = event.target;
    setInputValue(value);
  };

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection, window.solana, opts.preflightCommitment,
    );
    return provider;
  }

  /*
   * We want to render this UI when the user hasn't connected
   * their wallet to our app yet.
   */
  const renderNotConnectedContainer = () => (
    <button
      className="cta-button connect-wallet-button"
      onClick={connectWallet}
    >
      Connect to Wallet
    </button>
  );

  const renderConnectedContainer = () => {
    // If we hit this, it means the program account hasn't be initialized.
    if (gifList === null) {
      return (
        <div className="connected-container">
          <button className="cta-button submit-gif-button" onClick={createGifAccount}>
            Do one-time initialization for Quotes GIF Program Account
          </button>
        </div>
      )
    }
    // Otherwise, we're good! Account exists. User can submit GIFs.
    else {
      return (
        <div className="connected-container">
          {/* Go ahead and add this input and button to start */}
          <input type="text" placeholder="Enter gif link!" value={inputValue} onChange={onInputChange} />
          <button className="cta-button submit-gif-button" onClick={sendGif}>Submit</button>
          <div className="gif-grid">
            {gifList.map((item, index) => (
              <div className="gif-item" key={index}>
                <img src={item.gifLink} alt={`gif-${index}`} />
                <a href={`https://explorer.solana.com/address/${item.userAddress.toString()}?cluster=${cluster}`}
                   target="_blank"
                   rel="noreferrer"
                >{item.userAddress.toString()}</a>

                <div className="vote">
                  <span className="vote-counter">{item.votes.toString()} votes</span>
                  <button className="vote-button vote-up-button" onClick={upVote} value={index}>+1</button>
                  <button className="vote-button vote-down-button" onClick={downVote} value={index}>-1</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }
  };

  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log("ping")
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      });
      console.log("Created a new BaseAccount w/ address:", baseAccount.publicKey.toString())
      await getGifList();
    }
    catch(error) {
      console.log("Error creating BaseAccount account:", error)
    }
  }

  const getGifList = async() => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);

      console.log("Got the account", account)
      setGifList(account.gifList)

    } catch (error) {
      console.log("Error in getGifs: ", error)
      setGifList(null);
    }
  }

  const sendGif = async () => {
    if (inputValue.length === 0) {
      console.log("No GIF link given!")
      return
    }
    console.log('GIF link:', inputValue);
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);

      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
        },
      });
      console.log("GIF successfully sent to program", inputValue)

      await getGifList();
    } catch (error) {
      console.error("Error sending GIF:", error)
    }
  };

  const upVote = async (event) => {
    try {
      event.preventDefault();

      const target = event.target;
      const index = target.value;

      const provider = getProvider();
      const program = new Program(idl, programID, provider);

      await program.rpc.upVote(new BN(index), {
        accounts: {
          baseAccount: baseAccount.publicKey,
        },
      });
      console.log("Upvote successfully sent to program", index);

      await getGifList();
    } catch (error) {
      console.error("Error sending up vote: ", error)
    }
  };

  const downVote = async (event) => {
    try {
      event.preventDefault();

      const target = event.target;
      const index = target.value;

      const provider = getProvider();
      const program = new Program(idl, programID, provider);

      await program.rpc.downVote(new BN(index), {
        accounts: {
          baseAccount: baseAccount.publicKey,
        },
      });
      console.log("Downvote successfully sent to program", index)

      await getGifList();
    } catch (error) {
      console.error("Error sending down vote: ", error)
    }
  };

  /*
   * When our component first mounts, let's check to see if we have a connected
   * Phantom Wallet
   */
  useEffect(() => {
    window.addEventListener('load', async (event) => {
      await checkIfWalletIsConnected();
    });
  }, []);

  useEffect(() => {
    if (walletAddress) {
      console.log('Fetching GIF list...');
      getGifList();
    }
  }, [walletAddress]);

  return (
    <div className="App">
      {/* This was solely added for some styling fanciness */}
			<div className={walletAddress ? 'authed-container' : 'container'}>
        <div className="container">
          <div className="header-container">
            <p className="header">🖼 Kaamelott Quotes GIF Portal</p>
            <p className="sub-text">
              View your Kaamelott Quotes GIF collection in the metaverse ✨
            </p>
            {/* Render your connect to wallet button right here */}
            {!walletAddress && renderNotConnectedContainer()}
            {/* Render the GIF collection if wallet is connected */}
            {walletAddress && renderConnectedContainer()}
          </div>

          <div className="footer-container">
            <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
            <span className="footer-text">built on <a
              href={TWITTER_LINK}
              target="_blank"
              rel="noreferrer"
            >{`@${TWITTER_HANDLE}`}</a> by <a
              href={MY_TWITTER_LINK}
              target="_blank"
              rel="noreferrer"
            >{`@${MY_TWITTER_HANDLE}`}</a>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
