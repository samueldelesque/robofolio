import React, { Component } from 'react';
import axios from 'axios';
import './App.css';
import portfolios from './portfolios';

const risk_ajustment = {
  10: -10, 9: -5, 8: 0, 7: 5, 6: 10, 5: 15, 4: 20, 3: 25, 2: 30, 1: 35
}

class App extends Component {
  state = {
    SHILLER_PE_RATIO: 20,
    risk_tolerance: 5,
    stocks_split: 0.5,
    bonds_split: 0.5,
    portfolio_size: 10000,
    stocks: [],
    bonds: [],
    edit_portfolio_size: false
  }

  async componentWillMount() {
    if (window.localStorage.getItem('robofolio-settings')) {
      const state = JSON.parse(window.localStorage.getItem('robofolio-settings'));
      this.setState(state);
    }
    const res = await axios.get('https://www.quandl.com/api/v3/datasets/MULTPL/SHILLER_PE_RATIO_MONTH.json?api_key=phsVbwWqxyHLyW7nZE44');
    const SHILLER_PE_RATIO = res.data.dataset && res.data.dataset.data && res.data.dataset.data[0][1];
    if (SHILLER_PE_RATIO) {
      this.ajustParams({ SHILLER_PE_RATIO });
    }
  }

  ajustParams(input={}) {
    const params = Object.assign({}, this.state, input);
    const {
      risk_tolerance,
      portfolio_size,
      SHILLER_PE_RATIO
    } = params;
    const risk_factor = risk_ajustment[risk_tolerance];
    const stocks_split = (100 - Math.max(Math.min(SHILLER_PE_RATIO, 50) + risk_factor, 5)) / 100;
    const bonds_split = 1 - stocks_split;

    window.localStorage.setItem('robofolio-settings', JSON.stringify({
      SHILLER_PE_RATIO,
      stocks_split,
      bonds_split,
      portfolio_size,
      risk_tolerance
    }));

    this.setState({
      SHILLER_PE_RATIO,
      stocks_split,
      bonds_split,
      portfolio_size,
      risk_tolerance
    });
  }

  render() {
    const {
      SHILLER_PE_RATIO,
      stocks_split,
      bonds_split,
      portfolio_size,
      risk_tolerance,
      edit_portfolio_size
    } = this.state;

    const portfolio = risk_tolerance >= 8 ?
      portfolios.growth:
        risk_tolerance <= 3 ?
          portfolios.income:
          portfolios.moderate

    return (
      <div className="App">
        <header className="App-header">
          <h1>Investment portfolio strategy</h1>
          <p></p>
        </header>
        <main className="App-content">
          <div className="Risks">
            <h2>Warning</h2>
            <p>None of the following material constitutes investment advice. I provide it as is solely to describe an investment strategy I personally pursue. If this strategy worked in the past it may not work in the future. I own shares of some the ETFs provided below.</p>
          </div>
          <p className="Intro">This strategy is based on some of Graham's principles, and a variable stock/bond ratio changing depending on the overall "priciness" of the market, as determined by the Shiller PE ratio (valuation divided by a 10y weighed earnings). The more bullish the market, the more stocks are sold to purchase bonds (selling high). The more bearish the market the more bonds we sell in order to purchase stocks (buying low). We presume stocks will continue providing higher returns in the long run while bonds will continue having less volatility. Low cost ETFs have been selected, and this strategy is meant to be held for the very long run. If you believe short term market fluctuations such as a recession would make you sell, you may be better off not investing at all.</p>
          <p>your portfolio size (click to edit): { edit_portfolio_size?
            <input value={ portfolio_size } onChange={e => this.ajustParams({ portfolio_size: Math.round(e.target.value) })} onBlur={ () => this.setState({ edit_portfolio_size: false }) } />:
            <span onClick={ () => this.setState({ edit_portfolio_size: true }) }>
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(portfolio_size)}
            </span>
          }</p>
          <p>market condition: <b>{ SHILLER_PE_RATIO > 22 ? 'bull' : 'bear' }</b> (Shiller PE Ratio = {Math.round(SHILLER_PE_RATIO  * 100) / 100})</p>
          <p>
            investor risk tolerance:
            <b> { risk_tolerance >= 8 ? 'high' : risk_tolerance <= 3 ? 'low': 'normal' } ({risk_tolerance}/10)</b>
            <button className="Button margin-left-md" onClick={ () => this.ajustParams({ risk_tolerance: Math.min(risk_tolerance + 1, 10) }) }>+</button>
            <button className="Button margin-left-md" onClick={ () => this.ajustParams({ risk_tolerance: Math.max(risk_tolerance - 1, 1) }) }>-</button>
          </p>
          <p>
            Risk levels:
            <ul>
              <li>1-3: for investors who will likely need to use returns from their investments within the next 5 years.</li>
              <li>4-7: for investors looking to use the funds in 10-20 years</li>
              <li>8-10: for investors looking grow their capital and won't need to take out liquidity in the foreseable future.</li>
            </ul>
          </p>
          <p>allocations to bonds: <b>{ Math.round(bonds_split * 10000) / 100 }%</b></p>
          <p>allocations to stocks: <b>{ Math.round(stocks_split * 10000) / 100 }%</b></p>
          <div className="Portfolio">
            <h4>Suggested portfolio</h4>
            <div className="Tickers">
              { portfolios.bonds.map(stock => (
                <div key={ stock.symbol } className="Ticker">
                  <b>{stock.symbol} </b>
                  ({ new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stock.allocation * portfolio_size * bonds_split) })
                  <i> { stock.description }</i>
                </div>
              )) }
              { portfolio.map(stock => (
                <div key={ stock.symbol } className="Ticker">
                  <b>{stock.symbol} </b>
                  ({ new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stock.allocation * portfolio_size * stocks_split) })
                  <i> { stock.description }</i>
                </div>
              )) }
            </div>
            <div className="Links">
              <a href="https://bit.ly/2TQtmSd" className="Button Robinhood" target="blank" ref="nofollow">
                Create this low cost portfolio on Robinhood with no fee
              </a>
            </div>
          </div>
        </main>
        <footer className="App-footer">
          <p>There is always the potential of losing money when you invest in securities. This website does not constitute investment advice, I am not a profesional investor or financial planner. Consult with your accountant and financial planner before making any investments.</p>
          <p>Any links on this page may provide afiliate revenue, and I may own shares in the securities listed.</p>
        </footer>
      </div>
    );
  }
}

export default App;
