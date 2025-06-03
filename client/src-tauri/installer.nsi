; Nyx Application Installer
; Custom NSIS installer template with Nyx branding

!include "MUI2.nsh"
!include "FileFunc.nsh"

; Installer configuration
!define PRODUCT_NAME "{{product_name}}"
!define PRODUCT_VERSION "{{version}}"
!define PRODUCT_PUBLISHER "{{author}}"
!define PRODUCT_WEB_SITE "https://github.com/kaunda-a/nyx-app"
!define PRODUCT_DIR_REGKEY "Software\Microsoft\Windows\CurrentVersion\App Paths\{{main_binary_name}}.exe"
!define PRODUCT_UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"
!define PRODUCT_UNINST_ROOT_KEY "HKLM"

; Installer settings
Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"
OutFile "{{out_file}}"
InstallDir "{{install_dir}}"
InstallDirRegKey HKLM "${PRODUCT_DIR_REGKEY}" ""
ShowInstDetails show
ShowUnInstDetails show

; Request admin privileges
RequestExecutionLevel admin

; Modern UI Configuration
!define MUI_ABORTWARNING

; Installer icons - use Tauri's icon path variables
!define MUI_ICON "{{icon_path}}"
!define MUI_UNICON "{{icon_path}}"

; Custom branding - disable custom bitmaps for now to avoid path issues
; !define MUI_HEADERIMAGE
; !define MUI_HEADERIMAGE_BITMAP "icons\installer-banner.bmp"
; !define MUI_HEADERIMAGE_RIGHT
; !define MUI_WELCOMEFINISHPAGE_BITMAP "icons\installer-banner.bmp"

; Custom installer appearance
!define MUI_WELCOMEPAGE_TITLE_3LINES
!define MUI_FINISHPAGE_TITLE_3LINES

; Welcome page customization
!define MUI_WELCOMEPAGE_TITLE "Welcome to Nyx Setup"
!define MUI_WELCOMEPAGE_TEXT "This wizard will guide you through the installation of Nyx.$\r$\n$\r$\nNyx is a powerful admin interface for managing services and data with embedded browser automation capabilities.$\r$\n$\r$\nClick Next to continue."

; Finish page customization
!define MUI_FINISHPAGE_TITLE "Nyx Installation Complete"
!define MUI_FINISHPAGE_TEXT "Nyx has been successfully installed on your computer.$\r$\n$\r$\nClick Finish to close this wizard."
!define MUI_FINISHPAGE_RUN "$INSTDIR\{{main_binary_name}}.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Launch Nyx now"

; Installer pages
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "{{license}}"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

; Uninstaller pages
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

; Languages
!insertmacro MUI_LANGUAGE "English"

; Version information
VIProductVersion "{{version_with_build}}"
VIAddVersionKey "ProductName" "${PRODUCT_NAME}"
VIAddVersionKey "ProductVersion" "${PRODUCT_VERSION}"
VIAddVersionKey "CompanyName" "${PRODUCT_PUBLISHER}"
VIAddVersionKey "FileDescription" "Nyx - Admin Interface with Browser Automation"
VIAddVersionKey "FileVersion" "${PRODUCT_VERSION}"
VIAddVersionKey "LegalCopyright" "© ${PRODUCT_PUBLISHER}"

; Installation section
Section "MainSection" SEC01
  SetOutPath "$INSTDIR"
  SetOverwrite ifnewer
  
  ; Install main files
{{#each binaries as |binary|}}
  File "{{binary}}"
{{/each}}

{{#each resources as |resource|}}
  File "{{resource}}"
{{/each}}

{{#each external_binaries as |ext|}}
  File "{{ext}}"
{{/each}}

  ; Create shortcuts
  CreateDirectory "$SMPROGRAMS\${PRODUCT_NAME}"
  CreateShortCut "$SMPROGRAMS\${PRODUCT_NAME}\${PRODUCT_NAME}.lnk" "$INSTDIR\{{main_binary_name}}.exe"
  CreateShortCut "$DESKTOP\${PRODUCT_NAME}.lnk" "$INSTDIR\{{main_binary_name}}.exe"
  
  ; Registry entries
  WriteRegStr HKLM "${PRODUCT_DIR_REGKEY}" "" "$INSTDIR\{{main_binary_name}}.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayName" "$(^Name)"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "UninstallString" "$INSTDIR\uninst.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayIcon" "$INSTDIR\{{main_binary_name}}.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayVersion" "${PRODUCT_VERSION}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "URLInfoAbout" "${PRODUCT_WEB_SITE}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "Publisher" "${PRODUCT_PUBLISHER}"
  
  ; Calculate installed size
  ${GetSize} "$INSTDIR" "/S=0K" $0 $1 $2
  IntFmt $0 "0x%08X" $0
  WriteRegDWORD ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "EstimatedSize" "$0"
  
  ; Create uninstaller
  WriteUninstaller "$INSTDIR\uninst.exe"
SectionEnd

; Uninstaller section
Section Uninstall
  ; Remove files
{{#each binaries as |binary|}}
  Delete "$INSTDIR\{{binary}}"
{{/each}}

{{#each resources as |resource|}}
  Delete "$INSTDIR\{{resource}}"
{{/each}}

  Delete "$INSTDIR\uninst.exe"
  
  ; Remove shortcuts
  Delete "$SMPROGRAMS\${PRODUCT_NAME}\${PRODUCT_NAME}.lnk"
  Delete "$DESKTOP\${PRODUCT_NAME}.lnk"
  RMDir "$SMPROGRAMS\${PRODUCT_NAME}"
  
  ; Remove registry entries
  DeleteRegKey ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}"
  DeleteRegKey HKLM "${PRODUCT_DIR_REGKEY}"
  
  ; Remove installation directory
  RMDir "$INSTDIR"
  
  SetAutoClose true
SectionEnd

; Functions
Function .onInit
  ; Check if already installed
  ReadRegStr $R0 ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "UninstallString"
  StrCmp $R0 "" done
  
  MessageBox MB_OKCANCEL|MB_ICONEXCLAMATION \
  "${PRODUCT_NAME} is already installed. $\n$\nClick OK to remove the previous version or Cancel to cancel this upgrade." \
  IDOK uninst
  Abort
  
uninst:
  ClearErrors
  ExecWait '$R0 _?=$INSTDIR'
  
  IfErrors no_remove_uninstaller done
    no_remove_uninstaller:
  
done:
FunctionEnd

Function un.onUninstSuccess
  HideWindow
  MessageBox MB_ICONINFORMATION|MB_OK "$(^Name) was successfully removed from your computer."
FunctionEnd

Function un.onInit
  MessageBox MB_ICONQUESTION|MB_YESNO|MB_DEFBUTTON2 "Are you sure you want to completely remove $(^Name) and all of its components?" IDYES +2
  Abort
FunctionEnd
