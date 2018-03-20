using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class ControllerInput : MonoBehaviour {

    SteamVR_TrackedController controller;
    GlobeRender globe;
    TableRender table;

    Transform target;

    private void Start()
    {
        globe = FindObjectOfType<GlobeRender>();
        table = FindObjectOfType<TableRender>();
        

        controller = GetComponent<SteamVR_TrackedController>();
        controller.TriggerUnclicked += TriggerClick;
    }

    private void TriggerClick(object sender, ClickedEventArgs e)
    {
        if (target != null)
        {
            if (target.CompareTag("MapTable"))
            {
                TableRender tableScript = target.GetComponent<TableRender>();
                tableScript.AddPoints("country_txt", "nkill", "count", 0.004f, (d) => { return true; });
                tableScript.animating = true;
            }
            else if (target.CompareTag("MapGlobe"))
            {
                GlobeRender globeScript = target.GetComponent<GlobeRender>();
                globeScript.AddPoints("country_txt", "nkill", "count", 0.004f, (d) => { return true; });
                globeScript.animating = true;
            }
        }
    }

    private void OnCollisionEnter(Collision collision)
    {
        Debug.Log("CollisionEnter(" + collision.gameObject.tag + ")");
        target = collision.transform;
    }

    private void OnCollisionExit(Collision collision)
    {
        Debug.Log("CollisionExit(" + collision.gameObject.tag + ")");
        target = null;
    }
}
