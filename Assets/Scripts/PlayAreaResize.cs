using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Valve.VR;

public class PlayAreaResize : MonoBehaviour {

	// Use this for initialization
	void Start () {
        OnEnable();
	}

    private void OnEnable()
    {
        HmdQuad_t rect = new HmdQuad_t();
        SteamVR_PlayArea.GetBounds(SteamVR_PlayArea.Size.Calibrated, ref rect);
        Vector3 newScale = new Vector3(
            Mathf.Abs(rect.vCorners0.v0 - rect.vCorners2.v0), 
            this.transform.localScale.y, 
            Mathf.Abs(rect.vCorners0.v2 - rect.vCorners2.v2));
        this.transform.localScale = newScale/10f;
    }
}
