import React, { Fragment, createRef } from 'react'
import cn from 'classnames'
import { withTranslation } from 'react-i18next'
import { Download, FileText, Settings, HelpCircle, MessageCircle, ChevronLeft } from 'react-feather'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import SettingsContext from 'contexts/SettingsContext'
import Overlay from './Overlay'
import GlobalSettings from './Settings'
import Changelog from './Changelog'
import Exported from './Exported'
import { handleIndex, handleJs, handleIcoAndCSS, handleLogo, handleFramesAndComponents, handleExports } from 'utils/download'
import { trimFilePath } from 'utils/helper'
import './header.scss'

class Header extends React.Component {
  figmacnLogo = createRef()
  logo = createRef()
  state = {
    loaderWidth: 0,
    loaderMessage: '',
    isExported: false
  }
  handleDownload = async () => {
    const { data: fileData, images, includeComponents, exportSettings, pagedFrames, documentName, t } = this.props
    const zip = new JSZip()
    
    await handleIndex(
      zip,
      { fileData, pagedFrames, includeComponents },
      () => { this.setLoader(3, t('dealing with', {name: 'index.html'})) }
    )
    await handleJs(zip, () => { this.setLoader(8, t('dealing with', {name: 'Js'})) })
    await handleIcoAndCSS(zip, () => { this.setLoader(12, t('dealing with', {name: 'CSS'})) })
    await handleLogo(zip, this.figmacnLogo.current.src, 'figmacn-logo.svg', () => { this.setLoader(14, t('dealing with', {name: 'figmacn-logo'})) })
    await handleLogo(zip, this.logo.current.src, 'logo.svg', () => { this.setLoader(16, t('dealing with', {name: 'logo'})) })
    await handleFramesAndComponents(zip, images, (index, name, length) => {
      this.setLoader(18+(index+1)*Math.floor(36/length), t('generating', {name}))
    })
    await handleExports(zip, exportSettings, (index, name, length) => {
      this.setLoader(54+(index+1)*Math.floor(36/length), t('generating', {name}))
    })
    // generate zip
    this.setLoader(92, t('generating zip'))
    zip.generateAsync({type: 'blob'})
      .then(content => {
        saveAs(content, `${trimFilePath(documentName)}.zip`)
        this.setLoader(100, t('marked zip downloaded'))
        this.toggleExportedOverlay()
      })
  }
  setLoader = (loaderWidth, loaderMessage) => {
    this.setState({
      loaderWidth,
      loaderMessage
    })
  }
  hasNames = () => {
    const { pageName, frameName } = this.props
    return !!(pageName && frameName)
  }
  toggleExportedOverlay = () => {
    const { isExported } = this.state
    this.setState({
      isExported: !isExported
    })
    if (isExported) {
      this.setLoader(0, '')
    }
  }
  componentDidMount () {
    // close exported message when clicking other places
    document.addEventListener('click', e => {
      const { isExported } = this.state
      if (isExported) {
        e.preventDefault()
        this.toggleExportedOverlay()
      }
    })
  }
  render () {
    const { isLocal, isMock, documentName, pageName, frameName, isComponent, onBack, t } = this.props
    const { loaderWidth, loaderMessage, isExported } = this.state
    const logoHidden = this.hasNames()
    return (
      <header className="app-header">
        <span className={cn('header-back', {'hide': !logoHidden || isLocal})} onClick={onBack}>
          <ChevronLeft size={24}/>
        </span>
        <a
          className={cn('header-figmacn-logo', {'hide': logoHidden})}
          href="https://figmacn.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img src={`${process.env.PUBLIC_URL}/figmacn-logo.svg`} alt="figmacn logo" ref={this.figmacnLogo}/>
        </a>
        <div className={cn('header-divider', {'hide': logoHidden})}/>
        <a
          className={cn('header-logo', {'hide': logoHidden && !isLocal})}
          href="https://figmacn.com/handoff-landing"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img src={`${process.env.PUBLIC_URL}/logo.svg`} alt="logo" ref={this.logo}/>
        </a>
        <span className="header-filename">{documentName}</span>
        <span className="header-space"/>
        {
          this.hasNames() ?
          <span className="header-pagename">
            {
              loaderWidth===0 ?
              <Fragment>
                {
                  !isComponent &&
                  <Fragment>{pageName}<span> / </span></Fragment>
                }
                {frameName}
              </Fragment> :
              loaderMessage
            }
          </span> :
          <span className="header-pagename">Juuust Handoff</span>
        }
        <div className="header-operates">
          {
            this.hasNames() &&
            <Overlay
              overlay={
                <SettingsContext.Consumer>
                  {({globalSettings, changeGlobalSettings}) => (
                    <GlobalSettings
                      globalSettings={globalSettings}
                      onSettingsChange={changeGlobalSettings}
                    />
                  )}
                </SettingsContext.Consumer>
              }
              overlayClassName="header-overlay header-overlay-settings"
            >
              <span title={t('settings')}>
                <Settings size={14}/>
              </span>
            </Overlay>
          }
          <Overlay
            trigger={['click']}
            overlay={<Changelog/>}
            align={{
              offset: [30, -10]
            }}
            overlayClassName="header-overlay header-overlay-changelog"
          >
            <span title={t('changelog')}>
              <FileText size={14}/>
            </span>
          </Overlay>
          <a title={t('help')} href={t('help link')} target="_blank" rel="noopener noreferrer">
            <HelpCircle size={14}/>
          </a>
          <a title={t('feedback')} href="https://github.com/leadream/figma-handoff/issues" target="_blank" rel="noopener noreferrer">
            <MessageCircle size={14}/>
          </a>
          {
            this.hasNames() && !isLocal && !isMock &&
            <Overlay
              visible={isExported}
              overlay={<Exported/>}
              align={{
                offset: [-6, -10]
              }}
              overlayClassName="header-overlay header-overlay-exported"
            >
              <span title={t('generate marked zip')} onClick={this.handleDownload}>
                <Download size={14}/>
              </span>
            </Overlay>
          }
        </div>
        <span className="header-loader" style={{width: `${loaderWidth}%`}}/>
      </header>
    )
  }
}

export default withTranslation('header')(Header)
