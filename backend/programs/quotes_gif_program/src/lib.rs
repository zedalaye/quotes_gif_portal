use anchor_lang::prelude::*;

declare_id!("4H8RWS5zZsj34WitF4JEuVLUxmsQgYBA9XxWBQBT52Sz");

#[program]
pub mod quotes_gif_program {
  use super::*;
  pub fn start_stuff_off(ctx: Context<StartStuffOff>) -> ProgramResult {
    // Get a reference to the account.
    let base_account = &mut ctx.accounts.base_account;
    // Initialize total_gifs.
    base_account.total_gifs = 0;
    Ok(())
  }

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

  pub fn update_item(ctx: Context<UpdateItem>, index: u64, vote: Vote) -> ProgramResult {
    let base_account = &mut ctx.accounts.base_account;

    let i = index as usize;
    if i < base_account.gif_list.len() {
      let mut item = &mut base_account.gif_list[i];
      item.votes += vote as i64;
    }

    Ok(())
  }

  pub fn up_vote(ctx: Context<UpdateItem>, index: u64) -> ProgramResult {
    let base_account = &mut ctx.accounts.base_account;

    let i = index as usize;
    if i < base_account.gif_list.len() {
      let mut item = &mut base_account.gif_list[i];
      item.votes += 1;
    }

    Ok(())
  }

  pub fn down_vote(ctx: Context<UpdateItem>, index: u64) -> ProgramResult {
    let base_account = &mut ctx.accounts.base_account;

    let i = index as usize;
    if i < base_account.gif_list.len() {
      let mut item = &mut base_account.gif_list[i];
      item.votes -= 1;
    }

    Ok(())
  }
}

// Attach certain variables to the StartStuffOff context.
#[derive(Accounts)]
pub struct StartStuffOff<'info> {
  #[account(init, payer = user, space = 9000)]
  pub base_account: Account<'info, BaseAccount>,

  #[account(mut)]
  pub user: Signer<'info>,
  pub system_program: Program <'info, System>,
}

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
}

// Tell Solana what we want to store on this account.
#[account]
pub struct BaseAccount {
  pub total_gifs: u64,
  // Attach a Vector of type ItemStruct to the account.
  pub gif_list: Vec<ItemStruct>,
}