import React from 'react';
import ReactDOM from 'react-dom';

import { Provider } from 'mobx-react';
import { Route } from "react-router";
import { HashRouter } from 'react-router-dom';
import { createBrowserHistory } from "history";

import './styles/index.styl';

import TopButton from './components/TopButton';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import MainPage from './components/MainPage';

import Model from './models';

// eslint-disable-next-line
eval('window.browserWindow = require("electron").remote');

const history = createBrowserHistory(),
    store = new Model();

ReactDOM.render((
    <div className="mechat" id="mechat">
        <Provider store={store}>
            <TopButton />
            <HashRouter history={history}>
                <Route path="/" exact>
                    <LoginPage />
                </Route>
                <Route path="/register" exact>
                    <RegisterPage />
                </Route>
                <Route path="/app">
                    <MainPage />
                </Route>
            </HashRouter>
        </Provider>
    </div>
), document.getElementById('root'));
