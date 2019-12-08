import React, { Component } from 'react';

import '../styles/TopButton.styl';

export default class TopButton extends Component {
    maximized = false;

    closeWindow() {
        window.close();
    }

    minimizeWindow() {
        window.browserWindow.getCurrentWindow().minimize();
    }

    maximizeWindow() {
        if (this.maximized)
            window.browserWindow.getCurrentWindow().unmaximize();
        else
            window.browserWindow.getCurrentWindow().maximize();
        this.maximized = !this.maximized;
    }

    render() {
        return (
            <div className='mechat-top-button-container'>
                <button className='mechat-top-button-exit' onClick={() => this.closeWindow()} />
                <button className='mechat-top-button-minimize' onClick={() => this.minimizeWindow()} />
                <button className='mechat-top-button-maxmize' onClick={() => this.maximizeWindow()} />
            </div>
        );
    }
}