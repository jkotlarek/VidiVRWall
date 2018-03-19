using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class BezierController : MonoBehaviour {

    BezierCurve bezier;
    public Transform start;
    public Transform end;
    public Vector3 startOffset;
    public Vector3 endOffset;

	// Use this for initialization
	void Start () {
        bezier = GetComponent<BezierCurve>();
        BezierPoint bp1 = bezier.AddPointAt(start.position + startOffset);
        BezierPoint bp2 = bezier.AddPointAt(end.position + endOffset);
        bp1.handle2 = endOffset;
        bp2.handle1 = endOffset;
	}
	
	// Update is called once per frame
	void Update () {
		
	}
}
