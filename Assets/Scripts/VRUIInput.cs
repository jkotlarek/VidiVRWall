using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;
using ZenFulcrum.EmbeddedBrowser;

[RequireComponent(typeof(SteamVR_LaserPointer))]
public class VRUIInput : MonoBehaviour
{
    private SteamVR_LaserPointer laserPointer;
    private SteamVR_TrackedController trackedController;

    private GUIBrowserUI browser;

    private void OnEnable()
    {
        laserPointer = GetComponent<SteamVR_LaserPointer>();
        laserPointer.PointerIn -= HandlePointerIn;
        laserPointer.PointerIn += HandlePointerIn;
        laserPointer.PointerOut -= HandlePointerOut;
        laserPointer.PointerOut += HandlePointerOut;
        laserPointer.PointerStay -= HandlePointerStay;
        laserPointer.PointerStay += HandlePointerStay;

        trackedController = GetComponent<SteamVR_TrackedController>();
        if (trackedController == null)
        {
            trackedController = GetComponentInParent<SteamVR_TrackedController>();
        }
        trackedController.TriggerClicked -= HandleTriggerClicked;
        trackedController.TriggerClicked += HandleTriggerClicked;
    }

    private void HandleTriggerClicked(object sender, ClickedEventArgs e)
    {
        if (EventSystem.current.currentSelectedGameObject != null)
        {
            Debug.Log("click");
            if (browser != null)
            {
                browser.triggerClick = true;
            }
            ExecuteEvents.Execute(EventSystem.current.currentSelectedGameObject, new PointerEventData(EventSystem.current), ExecuteEvents.submitHandler);
        }
    }

    private void HandlePointerIn(object sender, PointerEventArgs e)
    {
        var button = e.target.GetComponent<Button>();
        if (button != null)
        {
            button.Select();
            Debug.Log("HandlePointerIn", e.target.gameObject);
        }
        browser = e.target.GetComponentInChildren<GUIBrowserUI>();
        if (browser != null)
        {
            Debug.Log("BrowserSelected", e.target.gameObject);
            EventSystem.current.SetSelectedGameObject(browser.gameObject);
            browser.OnPointerEnter(null);
        }
    }

    private void HandlePointerOut(object sender, PointerEventArgs e)
    {

        var button = e.target.GetComponent<Button>();
        if (button != null)
        {
            EventSystem.current.SetSelectedGameObject(null);
            Debug.Log("HandlePointerOut", e.target.gameObject);
        }
        browser = e.target.GetComponentInChildren<GUIBrowserUI>();
        if (browser != null)
        {
            Debug.Log("BrowserDeselected", e.target.gameObject);
            browser.OnPointerExit(null);
            browser = null;
            EventSystem.current.SetSelectedGameObject(null);
        }
    }

    private void HandlePointerStay(object sender, PointerEventArgs e)
    {
        //Debug.Log("stay");
        if (browser != null)
        {
            Vector2 pos;
            RaycastHit hit = laserPointer.pointerHit;
            pos = RectTransformUtility.WorldToScreenPoint(Camera.main, hit.point);
            
            browser.pointerPos = pos;
        }
    }
}