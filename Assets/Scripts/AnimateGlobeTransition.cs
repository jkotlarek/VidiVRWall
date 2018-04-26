using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class AnimateGlobeTransition : MonoBehaviour {

    SkinnedMeshRenderer m;

    public Transform MapTransform0;
    public Transform MapTransform1;
    public Transform TableTransform0;
    public Transform TableTransform1;
    public Transform Table;

    float t = 0.0f;
    float fps = 60.0f;
    public bool animating = false;
    bool globe = false;

    public float time = 1.0f;
    public int key0 = 0;
    public int key1 = 100;


	// Use this for initialization
	void Start () {
	}
	
	// Update is called once per frame
	void FixedUpdate () {
        if (animating)
        {
            float inc = 1 / (time * fps);
            if (globe) inc *= -1;
            t += inc;

            if (t >= 1.0f)
            {
                t = 1.0f;
                globe = true;
                animating = false;
            }
            else if (t <= 0.0f)
            {
                t = 0.0f;
                globe = false;
                animating = false;
            }

            if (m == null) m = GetComponent<SkinnedMeshRenderer>();

            m.SetBlendShapeWeight(0, t*(key1-key0));

            transform.localPosition = Vector3.Slerp(MapTransform0.localPosition, MapTransform1.localPosition, t);
            transform.localRotation = Quaternion.Slerp(MapTransform0.localRotation, MapTransform1.localRotation, t);
            transform.localScale = Vector3.Slerp(MapTransform0.localScale, MapTransform1.localScale, t);

            Table.localPosition = Vector3.Lerp(TableTransform0.localPosition, TableTransform1.localPosition, t);
            Table.localRotation = Quaternion.Lerp(TableTransform0.localRotation, TableTransform1.localRotation, t);
            Table.localScale = Vector3.Lerp(TableTransform0.localScale, TableTransform1.localScale, t);
        }
    }
}
