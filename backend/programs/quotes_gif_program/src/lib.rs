use anchor_lang::prelude::*;

declare_id!("4H8RWS5zZsj34WitF4JEuVLUxmsQgYBA9XxWBQBT52Sz");

mod quotes_gif_internals {
  use super::*;

  pub fn do_vote(base_account: &mut Account<BaseAccount>, index: usize, vote: Vote) -> Result<()> {
    if index < base_account.gif_list.len() {
      let mut item = &mut base_account.gif_list[index];
      item.votes += vote as i64;
      Ok(())
    }
    else {
      Err(ErrorCode::GifIndexOutOfBounds.into())
    }
  }
}

#[program]
pub mod quotes_gif_program {
  use super::*;

  // initialize the program once
  pub fn initialize(ctx: Context<Initialize>) -> ProgramResult {
    let base_account = &mut ctx.accounts.base_account;
    base_account.total_gifs = 0;
    Ok(())
  }

  // // send $SOL to someone else
  // pub fn send_sol(ctx: Context<SendSol>, amount: u64) -> ProgramResult {
  //   let ix = anchor_lang::solana_program::system_instruction::transfer(
  //     &ctx.accounts.from.key(),
  //     &ctx.accounts.to.key(),
  //     amount
  //   );

  //   anchor_lang::solana_program::program::invoke(
  //     &ix,
  //     &[
  //       ctx.accounts.from.to_account_info(),
  //       ctx.accounts.to.to_account_info()
  //     ]
  //   )
  // }

  // register a new GIF
  pub fn add_gif(ctx: Context<AddGif>, gif_link: String) -> ProgramResult {
    let base_account = &mut ctx.accounts.base_account;
    let user = &mut ctx.accounts.user;

	  // Build the struct.
    let item = ItemStruct {
      gif_link: gif_link.to_string(),
      user_address: *user.to_account_info().key,
      votes: 0,
    };

	  // Add it to the gif_list vector.
    base_account.gif_list.push(item);
    base_account.total_gifs += 1;

    Ok(())
  }

  // Update GIF
  pub fn update_item(ctx: Context<UpdateItem>, index: u64, vote: Vote) -> Result<()> {
    let base_account = &mut ctx.accounts.base_account;
    quotes_gif_internals::do_vote(base_account, index as usize, vote)
  }

  pub fn up_vote(ctx: Context<UpdateItem>, index: u64) -> Result<()> {
    let base_account = &mut ctx.accounts.base_account;
    quotes_gif_internals::do_vote(base_account, index as usize, Vote::Up)
  }

  pub fn down_vote(ctx: Context<UpdateItem>, index: u64) -> Result<()> {
    let base_account = &mut ctx.accounts.base_account;
    quotes_gif_internals::do_vote(base_account, index as usize, Vote::Down)
  }
}

// Attach certain variables to the StartStuffOff context.
#[derive(Accounts)]
pub struct Initialize<'info> {
  #[account(init, payer = user, space = 9000)]
  pub base_account: Account<'info, BaseAccount>,
  #[account(mut)]
  pub user: Signer<'info>,
  pub system_program: Program <'info, System>,
}

// #[derive(Accounts)]
// pub struct SendSol<'info> {
//   #[account(mut)]
//   pub from: Signer<'info>,
//   #[account(mut)]
//   pub to: AccountInfo<'info>,
//   pub system_program: Program<'info, System>,
// }

// Specify what data you want in the AddGif Context.
// Getting a handle on the flow of things :)?
#[derive(Accounts)]
pub struct AddGif<'info> {
  #[account(mut)]
  pub base_account: Account<'info, BaseAccount>,
  #[account(mut)]
  pub user: Signer<'info>
}

// Create a custom struct for us to work with.
#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct ItemStruct {
  pub gif_link: String,
  pub user_address: Pubkey,
  pub votes: i64,
}

#[derive(Debug, Copy, Clone, AnchorSerialize, AnchorDeserialize)]
pub enum Vote {
  Down = -1,
  Up   =  1,
}

#[derive(Accounts)]
pub struct UpdateItem<'info> {
  #[account(mut)]
  pub base_account: Account<'info, BaseAccount>,
  #[account(mut)]
  pub user: Signer<'info>
}

// Tell Solana what we want to store on this account.
#[account]
pub struct BaseAccount {
  pub total_gifs: u64,
  // Attach a Vector of type ItemStruct to the account.
  pub gif_list: Vec<ItemStruct>,
}

#[error]
pub enum ErrorCode {
    #[msg("No GIF at this index")]
    GifIndexOutOfBounds,
}