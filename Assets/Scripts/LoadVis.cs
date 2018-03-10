using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using ZenFulcrum.EmbeddedBrowser;

public class LoadVis : MonoBehaviour
{

    public string visName;

    string fullpath;

    // Use this for initialization
    void Start()
    {
        fullpath = Application.streamingAssetsPath + "/D3Vis/" + visName + ".html";
        gameObject.GetComponent<Browser>().LoadURL(fullpath, true);
    }

}
